#!/bin/bash
# Quick log checker for PhotoVault workflows

echo "📋 PhotoVault Log Checker"
echo "=========================="
echo ""

# Check if workflow logs exist
PHOTOVAULT_LOG="/tmp/logs/PhotoVault_Server_*.log"
EXPO_LOG="/tmp/logs/Expo_Server_*.log"

echo "🔍 Checking PhotoVault Server logs..."
if ls $PHOTOVAULT_LOG 1> /dev/null 2>&1; then
    LATEST_PHOTOVAULT=$(ls -t $PHOTOVAULT_LOG | head -1)
    echo "✅ Latest log: $LATEST_PHOTOVAULT"
    echo ""
    echo "Last 20 lines:"
    echo "----------------------------------------"
    tail -20 "$LATEST_PHOTOVAULT"
    echo "----------------------------------------"
    echo ""
    
    # Check for errors
    ERROR_COUNT=$(grep -i "error\|exception\|failed" "$LATEST_PHOTOVAULT" | wc -l)
    if [ $ERROR_COUNT -gt 0 ]; then
        echo "⚠️  Found $ERROR_COUNT error/exception lines:"
        grep -i "error\|exception\|failed" "$LATEST_PHOTOVAULT" | tail -10
    else
        echo "✅ No errors found in recent logs"
    fi
else
    echo "❌ No PhotoVault Server logs found"
    echo "💡 Is the server running?"
fi

echo ""
echo "=========================================="
echo ""

echo "🔍 Checking Expo Server logs..."
if ls $EXPO_LOG 1> /dev/null 2>&1; then
    LATEST_EXPO=$(ls -t $EXPO_LOG | head -1)
    echo "✅ Latest log: $LATEST_EXPO"
    echo ""
    echo "Last 20 lines:"
    echo "----------------------------------------"
    tail -20 "$LATEST_EXPO"
    echo "----------------------------------------"
else
    echo "❌ No Expo Server logs found"
    echo "💡 Is the Expo server running?"
fi

echo ""
echo "=========================================="
echo ""
echo "💡 Tip: Use 'tail -f <log_file>' to watch logs in real-time"
echo "   Example: tail -f $LATEST_PHOTOVAULT"
