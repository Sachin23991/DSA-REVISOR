# DSA Tracker — C++ Backend Engine

## Overview

This directory contains the **C++ backend engine** for the Work-Tracker DSA question recorder. It implements core **Data Structures and Algorithms (DSA)** from scratch to power the question management, revision scheduling, search, and analytics features of the application.

## Data Structures & Algorithms Implemented

| # | Data Structure / Algorithm | File | Purpose |
|---|---------------------------|------|---------|
| 1 | **Hash Map** (Separate Chaining) | `include/question_hashmap.h` | O(1) question storage & retrieval by ID |
| 2 | **Min-Heap** (Binary Heap / Priority Queue) | `include/revision_heap.h` | Priority-based revision scheduling |
| 3 | **Trie** (Prefix Tree) | `include/question_trie.h` | Search autocomplete & fuzzy matching |
| 4 | **Graph** (Adjacency List DAG) | `include/topic_graph.h` | Topic dependency modeling |
| 5 | **BFS** (Breadth-First Search) | `include/topic_graph.h` | Level-order topic traversal |
| 6 | **DFS** (Depth-First Search) | `include/topic_graph.h` | Deep topic chain exploration |
| 7 | **Topological Sort** (Kahn's + DFS) | `include/topic_graph.h` | Optimal study order computation |
| 8 | **Shortest Path** (BFS on unweighted graph) | `include/topic_graph.h` | Prerequisite distance calculation |
| 9 | **Merge Sort** | `include/sorting_engine.h` | Stable O(n log n) sorting |
| 10 | **Quick Sort** (Randomized) | `include/sorting_engine.h` | Average O(n log n) in-place sorting |
| 11 | **Counting Sort** | `include/sorting_engine.h` | O(n+k) non-comparison sort by category |
| 12 | **Insertion Sort** | `include/sorting_engine.h` | Adaptive sort for small/nearly-sorted data |
| 13 | **Heap Sort** | `include/sorting_engine.h` | Guaranteed O(n log n) in-place |
| 14 | **SM-2 Revision Engine** | `include/revision_engine.h` | Spaced repetition scheduling & XP calculation |
| 15 | **Gamification System** | `include/gamification.h` | XP, levels, streaks, badges, milestones |
| 16 | **Analytics Engine** | `include/analytics_engine.h` | Topic stats, difficulty breakdown, study suggestions |

## Complexity Summary

```
┌───────────────────────┬──────────────────┬──────────────┐
│ Operation             │ Time Complexity  │ Space        │
├───────────────────────┼──────────────────┼──────────────┤
│ HashMap Insert/Get    │ O(1) average     │ O(n + m)     │
│ Heap Push/Pop         │ O(log n)         │ O(n)         │
│ Heap Build (Floyd's)  │ O(n)             │ O(n)         │
│ Trie Insert/Search    │ O(L)             │ O(N × L)     │
│ Trie Autocomplete     │ O(L + K)         │ O(K)         │
│ Trie Fuzzy Search     │ O(N × L) pruned  │ O(L × T)     │
│ Graph BFS/DFS         │ O(V + E)         │ O(V)         │
│ Topological Sort      │ O(V + E)         │ O(V)         │
│ Merge Sort            │ O(n log n)       │ O(n)         │
│ Quick Sort            │ O(n log n) avg   │ O(log n)     │
│ Counting Sort         │ O(n + k)         │ O(n + k)     │
│ Heap Sort             │ O(n log n)       │ O(1)         │
└───────────────────────┴──────────────────┴──────────────┘
```

## Project Structure

```
cpp/
├── include/
│   ├── dsa_core.h            # Core types: Question, Topic, enums, utilities
│   ├── question_hashmap.h    # Hash Map with separate chaining (djb2 hash)
│   ├── revision_heap.h       # Binary Min-Heap priority queue
│   ├── question_trie.h       # Trie with autocomplete & fuzzy search
│   ├── topic_graph.h         # DAG with BFS, DFS, topological sort
│   ├── sorting_engine.h      # 5 sorting algorithms + smart selection
│   ├── revision_engine.h     # SM-2 spaced repetition engine
│   ├── gamification.h        # XP, levels, streaks, badges system
│   └── analytics_engine.h    # Analytics & statistics computation
├── src/
│   └── main.cpp              # Driver program demonstrating all 8 modules
├── build/                    # Compiled output
├── Makefile                  # Build system
└── README.md                 # This file
```

## How to Build & Run

### Prerequisites
- **g++** with C++17 support (GCC 7+ or Clang 5+)
- **Make** (optional, for Makefile usage)

### Using Makefile (Linux/macOS)
```bash
cd cpp
make        # Build
make run    # Build and run
make clean  # Remove build artifacts
make debug  # Build with debug symbols
```

### Manual Compilation (Windows/Any)
```bash
cd cpp
g++ -std=c++17 -O2 -I include src/main.cpp -o dsa_tracker.exe
./dsa_tracker.exe
```

### Using MSVC (Visual Studio)
```cmd
cl /std:c++17 /EHsc /I include src\main.cpp /Fe:dsa_tracker.exe
dsa_tracker.exe
```

## How DSA Components Map to the Frontend

| C++ DSA Component | Frontend Feature (JS) | File |
|-------------------|-----------------------|------|
| Hash Map | `localStorage` question CRUD | `js/store.js` |
| Min-Heap | Revision due date scheduling | `js/revision-engine.js` |
| Trie | Question search & filter | `js/app.js` (filter UI) |
| Topic Graph | Topic dependency visualization | `js/charts.js` |
| Sorting Algorithms | Question list sorting | `js/app.js` (sort controls) |
| SM-2 Algorithm | Spaced repetition engine | `js/revision-engine.js` |

## Key DSA Concepts Demonstrated

### 1. Hash Map (Separate Chaining)
- **djb2** hash function for string hashing
- Dynamic resizing when load factor > 0.75
- Collision tracking and distribution analysis

### 2. Min-Heap Priority Queue
- **Floyd's build-heap** algorithm — O(n) construction
- **Sift-up / Sift-down** operations for heap maintenance
- Priority scoring based on overdue days, difficulty, and ease factor

### 3. Trie (Prefix Tree)
- Case-insensitive search using character normalization
- **DFS collection** for autocomplete suggestions
- **Levenshtein distance** with trie pruning for fuzzy search ("Did you mean?")

### 4. Graph Algorithms
- **Kahn's algorithm** (BFS-based topological sort) for study order
- **DFS-based topological sort** with cycle detection
- **BFS shortest path** on unweighted graph for prerequisite distance
- Standard **DSA curriculum DAG** with 25+ topics

### 5. Sorting Algorithms
- **Hybrid Quick Sort**: falls back to insertion sort for small partitions
- **Counting Sort**: exploits small key range (3 difficulty levels)
- **Smart Sort**: auto-selects algorithm based on data characteristics
