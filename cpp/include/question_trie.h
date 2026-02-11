/* ═══════════════════════════════════════════════════════════════════
   DSA Tracker — Trie (Prefix Tree) for Question Search & Autocomplete
   
   Time:  Insert / Search → O(L)  |  Autocomplete → O(L + K)
   Space: O(N × L)
   ═══════════════════════════════════════════════════════════════════ */

#ifndef QUESTION_TRIE_H
#define QUESTION_TRIE_H

#include "dsa_core.h"
#include <unordered_map>
#include <memory>
#include <queue>

using namespace std;

namespace dsa {

struct TrieNode {
    unordered_map<char, unique_ptr<TrieNode>> children;
    bool   isEndOfWord;
    string questionId;
    int    prefixCount;

    TrieNode() : isEndOfWord(false), prefixCount(0) {}
};

class QuestionTrie {
private:
    unique_ptr<TrieNode> root_;
    int totalWords_;

    static string toLower(const string& s) {
        string r = s;
        transform(r.begin(), r.end(), r.begin(), ::tolower);
        return r;
    }

    void collectWords(TrieNode* node, const string& prefix,
                      vector<string>& results, int maxResults) const {
        if (!node || static_cast<int>(results.size()) >= maxResults) return;
        if (node->isEndOfWord) results.push_back(prefix);

        vector<pair<char, TrieNode*>> sorted;
        for (auto& kv : node->children)
            sorted.emplace_back(kv.first, kv.second.get());
        sort(sorted.begin(), sorted.end());

        for (auto& sc : sorted)
            collectWords(sc.second, prefix + sc.first, results, maxResults);
    }

    void fuzzyHelper(TrieNode* node, const string& target,
                     const string& current, vector<int>& prevRow,
                     vector<pair<string, int>>& results, int maxDist) const {
        int cols = static_cast<int>(target.size()) + 1;
        if (node->isEndOfWord && prevRow[cols - 1] <= maxDist)
            results.emplace_back(current, prevRow[cols - 1]);

        for (auto& kv : node->children) {
            char ch = kv.first;
            TrieNode* child = kv.second.get();
            vector<int> row(cols);
            row[0] = prevRow[0] + 1;
            for (int j = 1; j < cols; ++j) {
                int ins = row[j-1] + 1;
                int del = prevRow[j] + 1;
                int rep = prevRow[j-1] + (target[j-1] != ch ? 1 : 0);
                row[j] = min({ins, del, rep});
            }
            if (*min_element(row.begin(), row.end()) <= maxDist)
                fuzzyHelper(child, target, current + ch, row, results, maxDist);
        }
    }

    bool removeHelper(TrieNode* node, const string& word, int depth) {
        if (!node) return false;
        if (depth == static_cast<int>(word.size())) {
            if (!node->isEndOfWord) return false;
            node->isEndOfWord = false;
            totalWords_--;
            return node->children.empty();
        }
        char ch = word[depth];
        auto it = node->children.find(ch);
        if (it == node->children.end()) return false;
        if (removeHelper(it->second.get(), word, depth + 1)) {
            node->children.erase(ch);
            return !node->isEndOfWord && node->children.empty();
        }
        return false;
    }

public:
    QuestionTrie() : root_(make_unique<TrieNode>()), totalWords_(0) {}

    // Insert — O(L)
    void insert(const string& word, const string& qid = "") {
        string low = toLower(word);
        TrieNode* cur = root_.get();
        for (char ch : low) {
            cur->prefixCount++;
            if (cur->children.find(ch) == cur->children.end())
                cur->children[ch] = make_unique<TrieNode>();
            cur = cur->children[ch].get();
        }
        cur->prefixCount++;
        if (!cur->isEndOfWord) {
            cur->isEndOfWord = true;
            cur->questionId  = qid;
            totalWords_++;
        }
    }

    void insertQuestion(const Question& q) {
        insert(q.name, q.id);
        insert(q.subject, q.id);
        for (const auto& tag : q.tags) insert(tag, q.id);
    }

    // Search — O(L)
    bool search(const string& word) const {
        string low = toLower(word);
        TrieNode* cur = root_.get();
        for (char ch : low) {
            auto it = cur->children.find(ch);
            if (it == cur->children.end()) return false;
            cur = it->second.get();
        }
        return cur->isEndOfWord;
    }

    bool startsWith(const string& prefix) const {
        string low = toLower(prefix);
        TrieNode* cur = root_.get();
        for (char ch : low) {
            auto it = cur->children.find(ch);
            if (it == cur->children.end()) return false;
            cur = it->second.get();
        }
        return true;
    }

    // Autocomplete — O(L + K)
    vector<string> autocomplete(const string& prefix, int maxResults = 10) const {
        string low = toLower(prefix);
        TrieNode* cur = root_.get();
        for (char ch : low) {
            auto it = cur->children.find(ch);
            if (it == cur->children.end()) return {};
            cur = it->second.get();
        }
        vector<string> results;
        collectWords(cur, low, results, maxResults);
        return results;
    }

    int countWithPrefix(const string& prefix) const {
        string low = toLower(prefix);
        TrieNode* cur = root_.get();
        for (char ch : low) {
            auto it = cur->children.find(ch);
            if (it == cur->children.end()) return 0;
            cur = it->second.get();
        }
        return cur->prefixCount;
    }

    // Fuzzy search — Levenshtein + trie pruning
    vector<pair<string, int>> fuzzySearch(const string& target, int maxDist = 2) const {
        string low = toLower(target);
        vector<pair<string, int>> results;
        int cols = static_cast<int>(low.size()) + 1;
        vector<int> firstRow(cols);
        for (int i = 0; i < cols; ++i) firstRow[i] = i;

        for (auto& kv : root_->children) {
            char ch = kv.first;
            TrieNode* child = kv.second.get();
            vector<int> row(cols);
            row[0] = 1;
            for (int j = 1; j < cols; ++j) {
                int ins = row[j-1] + 1, del = firstRow[j] + 1;
                int rep = firstRow[j-1] + (low[j-1] != ch ? 1 : 0);
                row[j] = min({ins, del, rep});
            }
            if (*min_element(row.begin(), row.end()) <= maxDist) {
                string cur(1, ch);
                fuzzyHelper(child, low, cur, row, results, maxDist);
            }
        }

        sort(results.begin(), results.end(),
             [](const pair<string,int>& a, const pair<string,int>& b) {
                 return a.second < b.second;
             });
        return results;
    }

    bool removeWord(const string& word) {
        return removeHelper(root_.get(), toLower(word), 0);
    }

    int getTotalWords() const { return totalWords_; }

    void printStats() const {
        cout << "\n╔══════════════════════════════════════════╗\n"
             << "║       QUESTION TRIE (Prefix Tree)        ║\n"
             << "╠══════════════════════════════════════════╣\n"
             << "║ Total words indexed: " << totalWords_ << "\n"
             << "║ Root children: " << root_->children.size() << "\n"
             << "╚══════════════════════════════════════════╝\n";
    }
};

} // namespace dsa

#endif // QUESTION_TRIE_H
