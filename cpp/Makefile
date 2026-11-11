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

ifeq ($(OS),Windows_NT)
EXE_EXT = .exe
BUILD_PATH = $(subst /,\,$(BUILD_DIR))
MAKE_BUILD_DIR = if not exist "$(BUILD_PATH)" mkdir "$(BUILD_PATH)"
RUN_TARGET = "$(subst /,\,$(TARGET))"
else
MAKE_BUILD_DIR = mkdir -p "$(BUILD_DIR)"
RUN_TARGET = "$(TARGET)"
endif

TARGET       = $(BUILD_DIR)/dsa_tracker$(EXE_EXT)
DEBUG_TARGET = $(BUILD_DIR)/dsa_tracker_debug$(EXE_EXT)

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
	$(MAKE_BUILD_DIR)

# ── Run ──
run: $(TARGET)
	@echo ""
	@$(RUN_TARGET)

# ── Debug Build ──
debug: $(DEBUG_TARGET)
	@echo "  Debug build complete."

$(DEBUG_TARGET): $(SRCS) $(HEADERS) | $(BUILD_DIR)
	$(CXX) -std=c++17 -Wall -Wextra -g -DDEBUG $(INCLUDES) $(SRCS) -o $(DEBUG_TARGET)

# ── Clean ──
clean:
	rm -rf $(BUILD_DIR)
	@echo "  Cleaned build artifacts."

.PHONY: all run debug clean
