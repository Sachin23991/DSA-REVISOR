/* ═══════════════════════════════════════════════════════════════════
   DSA Tracker — DAG for Topic Dependencies
   
   Algorithms: BFS, DFS, Topological Sort (Kahn + DFS), Shortest Path
   Time: O(V + E) for all traversals
   ═══════════════════════════════════════════════════════════════════ */

#ifndef TOPIC_GRAPH_H
#define TOPIC_GRAPH_H

#include "dsa_core.h"
#include <unordered_map>
#include <unordered_set>
#include <queue>
#include <stack>
#include <set>

using namespace std;

namespace dsa {

class TopicGraph {
private:
    unordered_map<string, vector<string>> adj_;
    unordered_map<string, vector<string>> revAdj_;
    unordered_map<string, Topic>          topics_;
    unordered_map<string, int>            inDeg_;

    bool topSortDFS(const string& v, unordered_set<string>& visited,
                    unordered_set<string>& inStack, stack<string>& result) const {
        visited.insert(v);
        inStack.insert(v);
        auto it = adj_.find(v);
        if (it != adj_.end())
            for (const auto& nb : it->second) {
                if (inStack.count(nb)) return false;
                if (!visited.count(nb))
                    if (!topSortDFS(nb, visited, inStack, result)) return false;
            }
        inStack.erase(v);
        result.push(v);
        return true;
    }

public:
    TopicGraph() = default;

    void addTopic(const string& name) {
        if (topics_.find(name) == topics_.end()) {
            topics_[name] = Topic(name);
            adj_[name];
            revAdj_[name];
            inDeg_[name] = 0;
        }
    }

    void addPrerequisite(const string& prereq, const string& topic) {
        addTopic(prereq);
        addTopic(topic);
        adj_[prereq].push_back(topic);
        revAdj_[topic].push_back(prereq);
        inDeg_[topic]++;
    }

    // ── BFS — level-order traversal — O(V + E) ──
    vector<vector<string>> bfs(const string& start) const {
        vector<vector<string>> levels;
        if (adj_.find(start) == adj_.end()) return levels;

        unordered_set<string> visited;
        queue<string> q;
        q.push(start);
        visited.insert(start);

        while (!q.empty()) {
            int sz = static_cast<int>(q.size());
            vector<string> level;
            for (int i = 0; i < sz; ++i) {
                string cur = q.front(); q.pop();
                level.push_back(cur);
                auto it = adj_.find(cur);
                if (it != adj_.end())
                    for (const auto& nb : it->second)
                        if (!visited.count(nb)) { visited.insert(nb); q.push(nb); }
            }
            levels.push_back(level);
        }
        return levels;
    }

    // ── DFS — deep exploration — O(V + E) ──
    vector<string> dfs(const string& start) const {
        vector<string> result;
        if (adj_.find(start) == adj_.end()) return result;

        unordered_set<string> visited;
        stack<string> st;
        st.push(start);

        while (!st.empty()) {
            string cur = st.top(); st.pop();
            if (visited.count(cur)) continue;
            visited.insert(cur);
            result.push_back(cur);
            auto it = adj_.find(cur);
            if (it != adj_.end())
                for (int i = static_cast<int>(it->second.size()) - 1; i >= 0; --i)
                    if (!visited.count(it->second[i]))
                        st.push(it->second[i]);
        }
        return result;
    }

    // ── Topological Sort — Kahn's BFS — O(V + E) ──
    vector<string> topologicalSortKahn() const {
        unordered_map<string, int> deg = inDeg_;
        queue<string> q;
        for (auto& kv : deg)
            if (kv.second == 0) q.push(kv.first);

        vector<string> order;
        while (!q.empty()) {
            string cur = q.front(); q.pop();
            order.push_back(cur);
            auto it = adj_.find(cur);
            if (it != adj_.end())
                for (const auto& nb : it->second)
                    if (--deg[nb] == 0) q.push(nb);
        }
        return order;
    }

    // ── Topological Sort — DFS with cycle detection — O(V + E) ──
    vector<string> topologicalSortDFS() const {
        unordered_set<string> visited, inStack;
        stack<string> result;
        for (auto& kv : adj_)
            if (!visited.count(kv.first))
                if (!topSortDFS(kv.first, visited, inStack, result))
                    return {};
        vector<string> order;
        while (!result.empty()) { order.push_back(result.top()); result.pop(); }
        return order;
    }

    // ── Transitive prerequisites — BFS on reverse graph ──
    vector<string> getPrerequisites(const string& topic) const {
        vector<string> prereqs;
        if (revAdj_.find(topic) == revAdj_.end()) return prereqs;

        unordered_set<string> visited;
        queue<string> q;
        auto it = revAdj_.find(topic);
        if (it != revAdj_.end())
            for (const auto& p : it->second)
                if (!visited.count(p)) { visited.insert(p); q.push(p); }

        while (!q.empty()) {
            string cur = q.front(); q.pop();
            prereqs.push_back(cur);
            auto ri = revAdj_.find(cur);
            if (ri != revAdj_.end())
                for (const auto& p : ri->second)
                    if (!visited.count(p)) { visited.insert(p); q.push(p); }
        }
        return prereqs;
    }

    // ── Shortest path (BFS unweighted) — O(V + E) ──
    int shortestPath(const string& from, const string& to) const {
        if (from == to) return 0;
        if (adj_.find(from) == adj_.end() || adj_.find(to) == adj_.end()) return -1;

        unordered_map<string, int> dist;
        queue<string> q;
        dist[from] = 0;
        q.push(from);
        while (!q.empty()) {
            string cur = q.front(); q.pop();
            if (cur == to) return dist[to];
            auto it = adj_.find(cur);
            if (it != adj_.end())
                for (const auto& nb : it->second)
                    if (dist.find(nb) == dist.end()) {
                        dist[nb] = dist[cur] + 1;
                        q.push(nb);
                    }
        }
        return -1;
    }

    bool hasCycle() const {
        return static_cast<int>(topologicalSortKahn().size()) != static_cast<int>(topics_.size());
    }

    vector<string> getStartingTopics() const {
        vector<string> out;
        for (auto& kv : inDeg_)
            if (kv.second == 0) out.push_back(kv.first);
        sort(out.begin(), out.end());
        return out;
    }

    string getMostCriticalTopic() const {
        string best; int mx = -1;
        for (auto& kv : adj_) {
            int dep = static_cast<int>(kv.second.size());
            if (dep > mx) { mx = dep; best = kv.first; }
        }
        return best;
    }

    int getVertexCount() const { return static_cast<int>(topics_.size()); }
    int getEdgeCount() const {
        int c = 0;
        for (auto& kv : adj_) c += static_cast<int>(kv.second.size());
        return c;
    }

    void print() const {
        cout << "\n╔══════════════════════════════════════════╗\n"
             << "║    TOPIC DEPENDENCY GRAPH (DAG)          ║\n"
             << "╠══════════════════════════════════════════╣\n"
             << "║ Vertices: " << getVertexCount()
             << " | Edges: " << getEdgeCount() << "\n"
             << "╠══════════════════════════════════════════╣\n";
        for (auto& kv : adj_) {
            cout << "║ " << kv.first << " -> ";
            if (kv.second.empty()) cout << "(leaf)";
            else for (int i = 0; i < static_cast<int>(kv.second.size()); ++i) {
                if (i > 0) cout << ", ";
                cout << kv.second[i];
            }
            cout << "\n";
        }
        cout << "╠══════════════════════════════════════════╣\n"
             << "║ Has cycle: " << (hasCycle() ? "YES" : "NO") << "\n"
             << "╚══════════════════════════════════════════╝\n";
    }

    static TopicGraph createStandardDSAGraph() {
        TopicGraph g;
        g.addTopic("Arrays"); g.addTopic("Strings");
        g.addTopic("Mathematics"); g.addTopic("Bit Manipulation");

        g.addPrerequisite("Arrays", "Sorting");
        g.addPrerequisite("Arrays", "Binary Search");
        g.addPrerequisite("Arrays", "Two Pointers");
        g.addPrerequisite("Arrays", "Sliding Window");
        g.addPrerequisite("Arrays", "Prefix Sum");
        g.addPrerequisite("Arrays", "Linked Lists");
        g.addPrerequisite("Arrays", "Hashing");
        g.addPrerequisite("Strings", "Hashing");
        g.addPrerequisite("Strings", "Two Pointers");
        g.addPrerequisite("Arrays", "Stack");
        g.addPrerequisite("Arrays", "Queue");
        g.addPrerequisite("Linked Lists", "Stack");
        g.addPrerequisite("Linked Lists", "Queue");
        g.addPrerequisite("Linked Lists", "Trees");
        g.addPrerequisite("Stack", "Trees");
        g.addPrerequisite("Trees", "BST");
        g.addPrerequisite("Trees", "Heaps");
        g.addPrerequisite("BST", "AVL / Red-Black Trees");
        g.addPrerequisite("Trees", "Segment Trees");
        g.addPrerequisite("Trees", "Trie");
        g.addPrerequisite("Queue", "Graphs");
        g.addPrerequisite("Hashing", "Graphs");
        g.addPrerequisite("Graphs", "BFS / DFS");
        g.addPrerequisite("BFS / DFS", "Topological Sort");
        g.addPrerequisite("BFS / DFS", "Shortest Path");
        g.addPrerequisite("BFS / DFS", "MST");
        g.addPrerequisite("Graphs", "Disjoint Set (Union-Find)");
        g.addPrerequisite("Arrays", "Recursion");
        g.addPrerequisite("Mathematics", "Recursion");
        g.addPrerequisite("Recursion", "Dynamic Programming");
        g.addPrerequisite("Recursion", "Backtracking");
        g.addPrerequisite("Dynamic Programming", "DP on Trees");
        g.addPrerequisite("Dynamic Programming", "DP on Graphs");
        g.addPrerequisite("Sorting", "Greedy");

        return g;
    }
};

} // namespace dsa

#endif // TOPIC_GRAPH_H
