/* ═══════════════════════════════════════════════════════════════════
   DSA Tracker — Max-Heap Priority Queue for Revision Scheduling
   
   Data Structure : Binary Max-Heap (array-based)
   
   Time:  Push / Pop → O(log n)   |   Peek → O(1)   |   Build → O(n)
   Space: O(n)
   ═══════════════════════════════════════════════════════════════════ */

#ifndef REVISION_HEAP_H
#define REVISION_HEAP_H

#include "dsa_core.h"
#include <queue>
#include <utility>
#include <vector>
#include <stdexcept>

using namespace std;

namespace dsa {

struct HeapEntry {
    Question question;
    double   priorityScore;   // higher = more urgent

    HeapEntry() : priorityScore(0.0) {}
    HeapEntry(const Question& q, double s) : question(q), priorityScore(s) {}

    bool operator>(const HeapEntry& o) const { return priorityScore > o.priorityScore; }
    bool operator<(const HeapEntry& o) const { return priorityScore < o.priorityScore; }
};

class RevisionHeap {
private:
    vector<HeapEntry> heap_;

    static int parent(int i)     { return (i - 1) / 2; }
    static int leftChild(int i)  { return 2 * i + 1; }
    static int rightChild(int i) { return 2 * i + 2; }

    static bool isDue(const Question& question, const string& today) {
        return question.hasScheduledRevision() && question.nextRevisionDate <= today;
    }

    // Bubble up — O(log n)
    void siftUp(int i) {
        while (i > 0) {
            int p = parent(i);
            if (heap_[i] > heap_[p]) { swap(heap_[i], heap_[p]); i = p; }
            else break;
        }
    }

    // Bubble down — O(log n)
    void siftDown(int i) {
        int n = static_cast<int>(heap_.size());
        while (true) {
            int largest = i;
            int l = leftChild(i), r = rightChild(i);
            if (l < n && heap_[l] > heap_[largest]) largest = l;
            if (r < n && heap_[r] > heap_[largest]) largest = r;
            if (largest != i) { swap(heap_[i], heap_[largest]); i = largest; }
            else break;
        }
    }

    void repairAt(int i) {
        if (i > 0 && heap_[i] > heap_[parent(i)]) siftUp(i);
        else siftDown(i);
    }

    void eraseAt(int i) {
        if (i == static_cast<int>(heap_.size()) - 1) {
            heap_.pop_back();
            return;
        }
        heap_[i] = std::move(heap_.back());
        heap_.pop_back();
        repairAt(i);
    }

public:
    RevisionHeap() = default;

    // Floyd's build-heap — O(n)
    RevisionHeap(const vector<Question>& questions, const string& today) {
        heap_.reserve(questions.size());
        for (const auto& q : questions) {
            if (isDue(q, today)) heap_.emplace_back(q, q.getPriorityScore(today));
        }
        for (int i = static_cast<int>(heap_.size()) / 2 - 1; i >= 0; --i)
            siftDown(i);
    }

    void push(const Question& q, const string& today) {
        if (!isDue(q, today)) return;
        heap_.emplace_back(q, q.getPriorityScore(today));
        siftUp(static_cast<int>(heap_.size()) - 1);
    }

    HeapEntry pop() {
        if (heap_.empty()) throw runtime_error("RevisionHeap::pop() — empty!");
        HeapEntry top = std::move(heap_.front());
        eraseAt(0);
        return top;
    }

    const HeapEntry& top() const {
        if (heap_.empty()) throw runtime_error("RevisionHeap::top() — empty!");
        return heap_[0];
    }

    bool remove(const string& qid) {
        for (int i = 0; i < static_cast<int>(heap_.size()); ++i)
            if (heap_[i].question.id == qid) {
                eraseAt(i);
                return true;
            }
        return false;
    }

    void updatePriority(const string& qid, const Question& updated, const string& today) {
        for (int i = 0; i < static_cast<int>(heap_.size()); ++i)
            if (heap_[i].question.id == qid) {
                if (isDue(updated, today)) {
                    heap_[i] = HeapEntry(updated, updated.getPriorityScore(today));
                    repairAt(i);
                } else eraseAt(i);
                return;
            }
        push(updated, today);
    }

    // Only the children of visited entries can contend for the next result.
    // This leaves the heap untouched and uses O(k) extra space and O(k log k) time.
    vector<HeapEntry> topK(int k) {
        if (k <= 0 || heap_.empty()) return {};
        const int count = min(k, static_cast<int>(heap_.size()));
        vector<HeapEntry> result;
        result.reserve(count);
        auto lessUrgent = [this](int a, int b) { return heap_[a] < heap_[b]; };
        priority_queue<int, vector<int>, decltype(lessUrgent)> candidates(lessUrgent);
        candidates.push(0);
        for (int i = 0; i < count; ++i) {
            const int index = candidates.top();
            candidates.pop();
            result.push_back(heap_[index]);
            if (leftChild(index) < size()) candidates.push(leftChild(index));
            if (rightChild(index) < size()) candidates.push(rightChild(index));
        }
        return result;
    }

    bool empty() const { return heap_.empty(); }
    int  size()  const { return static_cast<int>(heap_.size()); }

    bool isValidHeap() const {
        int n = static_cast<int>(heap_.size());
        for (int i = 0; i < n; ++i) {
            int l = leftChild(i), r = rightChild(i);
            if (l < n && heap_[l] > heap_[i]) return false;
            if (r < n && heap_[r] > heap_[i]) return false;
        }
        return true;
    }

    void print() const {
        cout << "\n╔══════════════════════════════════════════╗\n"
             << "║     REVISION PRIORITY QUEUE (Max-Heap)   ║\n"
             << "╠══════════════════════════════════════════╣\n";
        for (int i = 0; i < static_cast<int>(heap_.size()); ++i)
            cout << "║ [" << i << "] Score: "
                 << fixed << setprecision(2) << heap_[i].priorityScore
                 << " | " << heap_[i].question.name
                 << " (" << difficultyToString(heap_[i].question.difficulty) << ")\n";
        cout << "╚══════════════════════════════════════════╝\n"
             << "Heap valid: " << (isValidHeap() ? "YES" : "NO") << "\n";
    }
};

} // namespace dsa

#endif // REVISION_HEAP_H
