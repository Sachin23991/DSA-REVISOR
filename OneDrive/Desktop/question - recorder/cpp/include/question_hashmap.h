/* ═══════════════════════════════════════════════════════════════════
   DSA Tracker — Custom Hash Map for O(1) Question Lookup
   
   Data Structure : Hash Table with Separate Chaining
   Hash Function  : djb2 by Dan Bernstein
   
   Time:  Insert / Get / Delete → O(1) average
   Space: O(n + m) where m = bucket count
   ═══════════════════════════════════════════════════════════════════ */

#ifndef QUESTION_HASHMAP_H
#define QUESTION_HASHMAP_H

#include "dsa_core.h"
#include <list>
#include <utility>
#include <cassert>

using namespace std;

namespace dsa {

class QuestionHashMap {
private:
    using Entry  = pair<string, Question>;
    using Bucket = list<Entry>;

    static constexpr double LOAD_THRESHOLD = 0.75;
    static constexpr int    INIT_CAP       = 16;

    vector<Bucket> buckets_;
    int size_;
    int capacity_;
    int collisions_;

    // djb2 hash: hash * 33 + c
    static unsigned long djb2(const string& key) {
        unsigned long h = 5381;
        for (char c : key)
            h = ((h << 5) + h) + static_cast<unsigned long>(c);
        return h;
    }

    int index(const string& key) const {
        return static_cast<int>(djb2(key) % static_cast<unsigned long>(capacity_));
    }

    void rehash() {
        int newCap = capacity_ * 2;
        vector<Bucket> newBuckets(newCap);

        for (auto& bucket : buckets_)
            for (auto& entry : bucket) {
                int idx = static_cast<int>(djb2(entry.first) % static_cast<unsigned long>(newCap));
                newBuckets[idx].push_back(move(entry));
            }

        buckets_  = move(newBuckets);
        capacity_ = newCap;

        collisions_ = 0;
        for (auto& b : buckets_)
            if (b.size() > 1)
                collisions_ += static_cast<int>(b.size()) - 1;
    }

public:
    QuestionHashMap()
        : buckets_(INIT_CAP), size_(0), capacity_(INIT_CAP), collisions_(0) {}

    explicit QuestionHashMap(int cap)
        : buckets_(cap), size_(0), capacity_(cap), collisions_(0) {}

    // ── Insert / Update — O(1) avg ──
    void put(const string& key, const Question& val) {
        if (static_cast<double>(size_ + 1) / capacity_ > LOAD_THRESHOLD)
            rehash();

        int idx = index(key);
        Bucket& b = buckets_[idx];

        for (auto& e : b)
            if (e.first == key) { e.second = val; return; }

        if (!b.empty()) collisions_++;
        b.emplace_back(key, val);
        size_++;
    }

    // ── Get — O(1) avg ──
    pair<bool, Question> get(const string& key) const {
        int idx = index(key);
        for (const auto& e : buckets_[idx])
            if (e.first == key)
                return {true, e.second};
        return {false, Question()};
    }

    bool contains(const string& key) const {
        int idx = index(key);
        for (const auto& e : buckets_[idx])
            if (e.first == key) return true;
        return false;
    }

    // ── Delete — O(1) avg ──
    bool remove(const string& key) {
        int idx = index(key);
        Bucket& b = buckets_[idx];
        for (auto it = b.begin(); it != b.end(); ++it)
            if (it->first == key) {
                b.erase(it);
                size_--;
                if (!b.empty()) collisions_--;
                return true;
            }
        return false;
    }

    // ── Bulk Access ──
    vector<Question> getAllQuestions() const {
        vector<Question> out;
        out.reserve(size_);
        for (const auto& b : buckets_)
            for (const auto& e : b)
                out.push_back(e.second);
        return out;
    }

    vector<Question> filter(function<bool(const Question&)> pred) const {
        vector<Question> out;
        for (const auto& b : buckets_)
            for (const auto& e : b)
                if (pred(e.second))
                    out.push_back(e.second);
        return out;
    }

    vector<Question> getBySubject(const string& subj) const {
        return filter([&](const Question& q) { return q.subject == subj; });
    }

    vector<Question> getByDifficulty(Difficulty d) const {
        return filter([d](const Question& q) { return q.difficulty == d; });
    }

    vector<Question> getByStatus(QuestionStatus s) const {
        return filter([s](const Question& q) { return q.status == s; });
    }

    // ── Stats ──
    int  size()       const { return size_; }
    bool empty()      const { return size_ == 0; }
    int  capacity()   const { return capacity_; }
    int  collisionCount() const { return collisions_; }
    double loadFactor() const { return static_cast<double>(size_) / capacity_; }

    void printStats() const {
        int emptyB = 0, maxChain = 0, usedB = 0;
        for (const auto& b : buckets_) {
            if (b.empty()) emptyB++;
            else {
                usedB++;
                int len = static_cast<int>(b.size());
                if (len > maxChain) maxChain = len;
            }
        }
        cout << "\n╔══════════════════════════════════════════╗\n"
             << "║     QUESTION HASH MAP (Separate Chain)   ║\n"
             << "╠══════════════════════════════════════════╣\n"
             << "║ Size: " << size_ << " | Capacity: " << capacity_ << "\n"
             << "║ Load Factor: " << fixed << setprecision(3) << loadFactor() << "\n"
             << "║ Used Buckets: " << usedB << " / " << capacity_ << "\n"
             << "║ Empty Buckets: " << emptyB << "\n"
             << "║ Collisions: " << collisions_ << "\n"
             << "║ Max Chain Length: " << maxChain << "\n"
             << "╚══════════════════════════════════════════╝\n";
    }

    Question& operator[](const string& key) {
        int idx = index(key);
        Bucket& b = buckets_[idx];
        for (auto& e : b)
            if (e.first == key) return e.second;
        b.emplace_back(key, Question());
        size_++;
        return b.back().second;
    }
};

} // namespace dsa

#endif // QUESTION_HASHMAP_H
