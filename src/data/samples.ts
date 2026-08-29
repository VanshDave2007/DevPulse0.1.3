import { PresetProject } from '../types';

export const SAMPLE_PROJECTS: PresetProject[] = [
  {
    id: 'py-smells',
    title: 'Order Processor & Payment Handler',
    language: 'python',
    category: 'Code Smells',
    description: 'Contains high cyclomatic complexity, bare except, mutable default args, and global state.',
    code: `import os
import json
import time
import requests

GLOBAL_PROCESSED_COUNT = 0

class OrderProcessor:
    def __init__(self, db_conn, cache_client=None):
        self.db = db_conn
        self.cache = cache_client

    # Code Smell: Mutable default argument ([])
    def process_bulk_orders(self, orders, retry_queue=[], max_attempts=3, notify_admin=False, log_channel="email", dry_run=False):
        global GLOBAL_PROCESSED_COUNT
        results = []
        
        # High cyclomatic complexity & deep nesting
        for order in orders:
            if order is not None:
                if order.get("status") == "PENDING":
                    if order.get("total", 0) > 0:
                        if order.get("payment_method") == "CREDIT_CARD":
                            try:
                                resp = requests.post("https://api.gateway.internal/charge", json=order)
                                if resp.status_code == 200:
                                    order["status"] = "COMPLETED"
                                    GLOBAL_PROCESSED_COUNT += 1
                                    results.append(order)
                                else:
                                    if max_attempts > 1:
                                        retry_queue.append(order)
                            # Code Smell: Bare except catches SystemExit & KeyboardInterrupt
                            except:
                                print("Payment gateway error occurred!")
                        elif order.get("payment_method") == "CRYPTO":
                            if order.get("crypto_tx_hash"):
                                order["status"] = "VERIFIED"
                                results.append(order)
                        elif order.get("payment_method") == "INVOICE":
                            order["status"] = "AWAITING_PAYMENT"
                            results.append(order)
                        else:
                            order["status"] = "UNKNOWN_METHOD"
                    else:
                        order["status"] = "INVALID_TOTAL"
                else:
                    if order.get("status") == "CANCELLED":
                        print("Skipping cancelled order")
                        
        return results
`,
  },
  {
    id: 'py-clean-oop',
    title: 'Clean Rate Limiter & Token Bucket',
    language: 'python',
    category: 'OOP',
    description: 'Clean object-oriented Python implementation of a thread-safe token bucket rate limiter.',
    code: `import time
import threading
from typing import Optional

class TokenBucketRateLimiter:
    """Thread-safe Token Bucket Rate Limiter with automatic token replenishment."""
    
    def __init__(self, capacity: int, refill_rate_per_sec: float) -> None:
        if capacity <= 0 or refill_rate_per_sec <= 0:
            raise ValueError("Capacity and refill rate must be positive numbers")
        self.capacity = float(capacity)
        self.tokens = float(capacity)
        self.refill_rate = float(refill_rate_per_sec)
        self.last_refill_timestamp = time.time()
        self._lock = threading.Lock()

    def _replenish(self) -> None:
        now = time.time()
        elapsed = now - self.last_refill_timestamp
        added_tokens = elapsed * self.refill_rate
        self.tokens = min(self.capacity, self.tokens + added_tokens)
        self.last_refill_timestamp = now

    def acquire(self, requested_tokens: int = 1) -> bool:
        with self._lock:
            self._replenish()
            if self.tokens >= requested_tokens:
                self.tokens -= requested_tokens
                return True
            return False

    def get_available_tokens(self) -> float:
        with self._lock:
            self._replenish()
            return self.tokens
`,
  },
  {
    id: 'js-async-smells',
    title: 'E-Commerce Analytics Engine',
    language: 'javascript',
    category: 'High Complexity',
    description: 'JavaScript service containing var scoping, eval anti-patterns, loose equality, and deep callback cascades.',
    code: `const fs = require('fs');
const http = require('http');

var globalSessionCount = 0;

function evaluateDynamicRule(userCondition, context) {
  // Critical Security Smell: eval with user input
  return eval("context." + userCondition);
}

function processAnalyticsData(payload, options, callback) {
  var results = [];
  
  if (payload != null) {
    if (payload.events && payload.events.length > 0) {
      for (var i = 0; i < payload.events.length; i++) {
        var evt = payload.events[i];
        if (evt.type == 'PAGE_VIEW') {
          if (evt.url && evt.url.indexOf('/checkout') !== -1) {
            if (evt.user && evt.user.isPremium == true) {
              if (evt.cart && evt.cart.total > 100) {
                try {
                  evt.discountApplied = true;
                  results.push(evt);
                } catch (e) {
                  // Code Smell: Empty catch block
                }
              }
            }
          }
        }
      }
    }
  }
  return results;
}
`,
  },
  {
    id: 'ts-clean-parser',
    title: 'Type-Safe Markdown Tokenizer',
    language: 'typescript',
    category: 'Beginner',
    description: 'Modular TypeScript lexical analyzer for markdown heading and block tokens.',
    code: `export interface Token {
  type: 'heading' | 'paragraph' | 'codeblock' | 'list_item';
  level?: number;
  content: string;
}

export class MarkdownParser {
  private rawText: string;

  constructor(text: string) {
    this.rawText = text;
  }

  public parse(): Token[] {
    const lines = this.rawText.split('\\n');
    const tokens: Token[] = [];

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      if (trimmed.startsWith('#')) {
        const match = trimmed.match(/^(#{1,6})\\s+(.+)$/);
        if (match) {
          tokens.push({
            type: 'heading',
            level: match[1].length,
            content: match[2],
          });
          continue;
        }
      }

      if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        tokens.push({
          type: 'list_item',
          content: trimmed.substring(2),
        });
        continue;
      }

      tokens.push({
        type: 'paragraph',
        content: trimmed,
      });
    }

    return tokens;
  }
}
`,
  },
  {
    id: 'java-service',
    title: 'Bank Account Transaction Dispatcher',
    language: 'java',
    category: 'Dependencies',
    description: 'Java enterprise transaction coordinator with multiple service imports and validation branches.',
    code: `package com.devpulse.finance.service;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.ArrayList;
import java.util.UUID;

public class TransactionDispatcher {
    private final String ledgerId;

    public TransactionDispatcher(String ledgerId) {
        this.ledgerId = ledgerId;
    }

    public boolean executeTransfer(String sourceAccountId, String targetAccountId, BigDecimal amount, String currency, boolean isExpress, int priorityLevel) {
        if (sourceAccountId == null || targetAccountId == null) {
            System.out.println("Source or target account missing");
            return false;
        }

        if (amount.compareTo(BigDecimal.ZERO) <= 0) {
            return false;
        }

        try {
            if (currency.equals("USD") || currency.equals("EUR")) {
                if (amount.compareTo(new BigDecimal("10000.00")) > 0) {
                    if (priorityLevel >= 2) {
                        return processHighValueTransfer(sourceAccountId, targetAccountId, amount);
                    }
                }
            }
            return true;
        } catch (Exception e) {
            // Generic catch smell
            System.err.println("Failed transfer: " + e.getMessage());
            return false;
        }
    }

    private boolean processHighValueTransfer(String source, String target, BigDecimal amt) {
        return true;
    }
}
`,
  },
  {
    id: 'go-concurrency',
    title: 'Concurrent Worker Pool with Channel Pipeline',
    language: 'go',
    category: 'OOP',
    description: 'Go concurrent job distribution system with goroutines, channels, and wait groups.',
    code: `package main

import (
	"fmt"
	"sync"
	"time"
)

type Job struct {
	ID    int
	Data  string
	Error error
}

type Result struct {
	Job    Job
	Output string
}

func Worker(id int, jobs <-chan Job, results chan<- Result, wg *sync.WaitGroup) {
	defer wg.Done()
	for job := range jobs {
		// Process job
		time.Sleep(50 * time.Millisecond)
		results <- Result{
			Job:    job,
			Output: fmt.Sprintf("Worker %d processed job %d: %s", id, job.ID, job.Data),
		}
	}
}

func main() {
	const numJobs = 10
	const numWorkers = 3

	jobs := make(chan Job, numJobs)
	results := make(chan Result, numJobs)
	var wg sync.WaitGroup

	for w := 1; w <= numWorkers; w++ {
		wg.Add(1)
		go Worker(w, jobs, results, &wg)
	}

	for j := 1; j <= numJobs; j++ {
		jobs <- Job{ID: j, Data: fmt.Sprintf("Payload_%d", j)}
	}
	close(jobs)

	wg.Wait()
	close(results)

	for r := range results {
		fmt.Println(r.Output)
	}
}
`,
  }
];
