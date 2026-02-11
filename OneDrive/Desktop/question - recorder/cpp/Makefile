# ═══════════════════════════════════════════════════════════
#  DSA Tracker — C++ Backend Build System
#  
#  Usage:
#    make          — Build the project
#    make run      — Build and run
#    make clean    — Remove build artifacts
#    make debug    — Build with debug symbols
# ═══════════════════════════════════════════════════════════

CXX       = g++
CXXFLAGS  = -std=c++17 -Wall -Wextra -O2
INCLUDES  = -I include
SRC_DIR   = src
BUILD_DIR = build
TARGET    = $(BUILD_DIR)/dsa_tracker

SRCS      = $(SRC_DIR)/main.cpp
HEADERS   = $(wildcard include/*.h)

# ── Default: Build ──
all: $(TARGET)
	@echo ""
	@echo "  Build successful! Run with: make run"
	@echo ""

$(TARGET): $(SRCS) $(HEADERS) | $(BUILD_DIR)
	$(CXX) $(CXXFLAGS) $(INCLUDES) $(SRCS) -o $(TARGET)

$(BUILD_DIR):
	mkdir -p $(BUILD_DIR)

# ── Run ──
run: $(TARGET)
	@echo ""
	@./$(TARGET)

# ── Debug Build ──
debug: CXXFLAGS = -std=c++17 -Wall -Wextra -g -DDEBUG
debug: $(TARGET)
	@echo "  Debug build complete."

# ── Clean ──
clean:
	rm -rf $(BUILD_DIR)
	@echo "  Cleaned build artifacts."

.PHONY: all run debug clean
