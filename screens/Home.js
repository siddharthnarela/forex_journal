import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  Platform,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Easing
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BarChart, LineChart } from 'react-native-gifted-charts';

const { width, height } = Dimensions.get('window');
export default function Home() {
  const [trades, setTrades] = useState([]);
  const [timeFrame, setTimeFrame] = useState('week'); // week, month, all
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [metrics, setMetrics] = useState({
    totalTrades: 0,
    winRate: 0,
    averageProfitLoss: 0,
    profitFactor: 0,
    bestTrade: 0,
    worstTrade: 0,
    consecutiveWins: 0,
    consecutiveLosses: 0,
    totalProfit: 0,
    totalLoss: 0
  });

  const screenWidth = Dimensions.get('window').width;


  useEffect(() => {
    loadTrades();
  }, []);

  const loadTrades = async () => {
  try {
    const storedTrades = await AsyncStorage.getItem('trades');
    const parsedTrades = storedTrades ? JSON.parse(storedTrades) : [];
    setTrades(parsedTrades);
    calculateMetrics(parsedTrades);
  } catch (error) {
    console.error('Error loading trades:', error);
    setTrades([]); // Fallback on error
  } finally {
    setLoading(false);
  }
};


  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    loadTrades().then(() => setRefreshing(false));
  }, []);

  const calculateMetrics = (tradesData) => {
    const closedTrades = tradesData.filter(trade => trade.status === 'CLOSED');
    
    if (closedTrades.length === 0) {
      setMetrics({
        totalTrades: 0,
        winRate: 0,
        averageProfitLoss: 0,
        profitFactor: 0,
        bestTrade: 0,
        worstTrade: 0,
        consecutiveWins: 0,
        consecutiveLosses: 0,
        totalProfit: 0,
        totalLoss: 0
      });
      return;
    }

    let totalProfit = 0;
    let totalLoss = 0;
    let winningTrades = 0;
    let currentConsecutiveWins = 0;
    let currentConsecutiveLosses = 0;
    let maxConsecutiveWins = 0;
    let maxConsecutiveLosses = 0;
    let bestTrade = Number.NEGATIVE_INFINITY;
    let worstTrade = Number.POSITIVE_INFINITY;

    closedTrades.forEach(trade => {
      const pnl = calculatePnL(trade);
      if (pnl > 0) {
        totalProfit += pnl;
        winningTrades++;
        currentConsecutiveWins++;
        currentConsecutiveLosses = 0;
        maxConsecutiveWins = Math.max(maxConsecutiveWins, currentConsecutiveWins);
        bestTrade = Math.max(bestTrade, pnl);
      } else {
        totalLoss += Math.abs(pnl);
        currentConsecutiveLosses++;
        currentConsecutiveWins = 0;
        maxConsecutiveLosses = Math.max(maxConsecutiveLosses, currentConsecutiveLosses);
        worstTrade = Math.min(worstTrade, pnl);
      }
    });

    setMetrics({
      totalTrades: closedTrades.length,
      winRate: (winningTrades / closedTrades.length * 100).toFixed(2),
      averageProfitLoss: ((totalProfit - totalLoss) / closedTrades.length).toFixed(2),
      profitFactor: totalLoss !== 0 ? (totalProfit / totalLoss).toFixed(2) : totalProfit.toFixed(2),
      bestTrade: bestTrade.toFixed(2),
      worstTrade: worstTrade.toFixed(2),
      consecutiveWins: maxConsecutiveWins,
      consecutiveLosses: maxConsecutiveLosses,
      totalProfit: totalProfit.toFixed(2),
      totalLoss: totalLoss.toFixed(2)
    });
  };

  const calculatePnL = (trade) => {
    if (!trade.exitPrice) return 0;
    
    const entry = parseFloat(trade.entryPrice);
    const exit = parseFloat(trade.exitPrice);
    const lots = parseFloat(trade.lotSize);
    
    if (trade.type === 'BUY') {
      return ((exit - entry) * lots * 100000);
    } else {
      return ((entry - exit) * lots * 100000);
    }
  };

  const getFilteredTrades = () => {
    const now = new Date();
    const msPerDay = 24 * 60 * 60 * 1000;
    
    return trades.filter(trade => {
      const tradeDate = new Date(trade.entryTime);
      const daysDiff = (now - tradeDate) / msPerDay;
      
      switch (timeFrame) {
        case 'week':
          return daysDiff <= 7;
        case 'month':
          return daysDiff <= 30;
        default:
          return true;
      }
    });
  };

const getProfitData = () => {
  const filteredTrades = getFilteredTrades();
  if (!filteredTrades || filteredTrades.length === 0) {
    return [{
      value: 0,
      dataPointText: '0'
    }];
  }

  const profitByDay = {};
  let cumulativeProfit = 0;

  // Sort trades by exit time to ensure chronological order
  const sortedTrades = [...filteredTrades]
    .filter(trade => trade.status === 'CLOSED' && trade.exitTime)
    .sort((a, b) => new Date(a.exitTime) - new Date(b.exitTime));

  sortedTrades.forEach(trade => {
    const date = new Date(trade.exitTime).toLocaleDateString();
    const pnl = calculatePnL(trade);
    cumulativeProfit += pnl;
    profitByDay[date] = cumulativeProfit;
  });

  // Convert to the format expected by react-native-gifted-charts
  return Object.entries(profitByDay).map(([date, value]) => ({
    value: Number(value),
    dataPointText: value.toFixed(2),
    label: date
  }));
};


  const getPairPerformance = () => {
  const filteredTrades = getFilteredTrades();
  if (!filteredTrades || filteredTrades.length === 0) {
    return [{
      value: 0,
      frontColor: '#3366FF',
      label: 'No Data'
    }];
  }

  const pairStats = {};

  filteredTrades.forEach(trade => {
    if (trade.status === 'CLOSED') {
      if (!pairStats[trade.pair]) {
        pairStats[trade.pair] = 0;
      }
      pairStats[trade.pair] += calculatePnL(trade);
    }
  });

  return Object.entries(pairStats).map(([pair, value]) => ({
    value: Number(value),
    frontColor: value >= 0 ? '#3366FF' : '#FF3D71',
    label: pair,
    topLabelComponent: () => (
      <Text style={styles.barChartLabel}>{value.toFixed(2)}</Text>
    )
  }));
};

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3366FF" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Time Frame Selector */}
        <View style={styles.timeFrameContainer}>
          <TouchableOpacity
            style={[styles.timeFrameButton, timeFrame === 'week' && styles.activeTimeFrame]}
            onPress={() => setTimeFrame('week')}
          >
            <Text style={[styles.timeFrameText, timeFrame === 'week' && styles.activeTimeFrameText]}>Week</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.timeFrameButton, timeFrame === 'month' && styles.activeTimeFrame]}
            onPress={() => setTimeFrame('month')}
          >
            <Text style={[styles.timeFrameText, timeFrame === 'month' && styles.activeTimeFrameText]}>Month</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.timeFrameButton, timeFrame === 'all' && styles.activeTimeFrame]}
            onPress={() => setTimeFrame('all')}
          >
            <Text style={[styles.timeFrameText, timeFrame === 'all' && styles.activeTimeFrameText]}>All Time</Text>
          </TouchableOpacity>
        </View>

        {/* Key Metrics Cards */}
        <View style={styles.metricsContainer}>
          <View style={styles.metricCard}>
            <MaterialCommunityIcons name="chart-line" size={24} color="#3366FF" />
            <Text style={styles.metricValue}>${metrics.totalProfit}</Text>
            <Text style={styles.metricLabel}>Total Profit</Text>
          </View>
          <View style={styles.metricCard}>
            <MaterialCommunityIcons name="percent" size={24} color="#00E096" />
            <Text style={styles.metricValue}>{metrics.winRate}%</Text>
            <Text style={styles.metricLabel}>Win Rate</Text>
          </View>
          <View style={styles.metricCard}>
            <MaterialCommunityIcons name="scale-balance" size={24} color="#FF3D71" />
            <Text style={styles.metricValue}>{metrics.profitFactor}</Text>
            <Text style={styles.metricLabel}>Profit Factor</Text>
          </View>
        </View>

       
        {/* Equity Curve */}
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Equity Curve</Text>
          <LineChart
    data={getProfitData()}
    width={width - 32}
    height={220}
    hideRules
    showVerticalLines
    color="#3366FF"
    thickness={2}
    maxValue={Math.max(...getProfitData().map(item => item.value), 0)}
    minValue={Math.min(...getProfitData().map(item => item.value), 0)}
    initialSpacing={10}
    endSpacing={10}
    spacing={40}
    backgroundColor="#fff"
    noOfSections={6}
  />

        </View>

        {/* Pair Performance */}
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Pair Performance</Text>
          <BarChart
    data={getPairPerformance()}
    width={width - 32}
    height={220}
    barWidth={28}
    hideRules
    spacing={40}
    initialSpacing={10}
    endSpacing={10}
  />
        </View>

        {/* Detailed Statistics */}
        <View style={styles.statsCard}>
          <Text style={styles.statsTitle}>Detailed Statistics</Text>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Total Trades</Text>
            <Text style={styles.statValue}>{metrics.totalTrades}</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Best Trade</Text>
            <Text style={[styles.statValue, { color: '#00E096' }]}>${metrics.bestTrade}</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Worst Trade</Text>
            <Text style={[styles.statValue, { color: '#FF3D71' }]}>${metrics.worstTrade}</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Average P/L</Text>
            <Text style={styles.statValue}>${metrics.averageProfitLoss}</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Consecutive Wins</Text>
            <Text style={styles.statValue}>{metrics.consecutiveWins}</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Consecutive Losses</Text>
            <Text style={styles.statValue}>{metrics.consecutiveLosses}</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// Color palette
const COLORS = {
  primary: '#2563EB',
  primaryLight: '#3B82F6',
  primaryDark: '#1D4ED8',
  success: '#10B981',
  danger: '#EF4444',
  warning: '#F59E0B',
  background: '#F8FAFC',
  cardBg: '#FFFFFF',
  text: {
    primary: '#1E293B',
    secondary: '#64748B',
    light: '#94A3B8',
    white: '#FFFFFF'
  },
  border: '#E2E8F0',
  shadow: '#0F172A'
};

// Common styles
const shadowStyle = Platform.select({
  ios: {
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  android: {
    elevation: 8,
  },
});

const styles = StyleSheet.create({
  // Container styles
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: COLORS.text.secondary,
    fontWeight: '500',
  },

  // Time Frame Selector
  timeFrameContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
    backgroundColor: COLORS.cardBg,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 20,
    ...shadowStyle,
  },
  timeFrameButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 16,
    backgroundColor: COLORS.background,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    minWidth: width * 0.25,
    alignItems: 'center',
  },
  activeTimeFrame: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primaryDark,
    transform: [{ scale: 1.02 }],
  },
  timeFrameText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text.secondary,
  },
  activeTimeFrameText: {
    color: COLORS.text.white,
  },

  // Metrics Cards
  metricsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    marginTop: 8,
  },
  metricCard: {
    flex: 1,
    backgroundColor: COLORS.cardBg,
    padding: 16,
    borderRadius: 20,
    marginHorizontal: 6,
    alignItems: 'center',
    ...shadowStyle,
    minHeight: height * 0.15,
    justifyContent: 'space-between',
  },
  metricIcon: {
    padding: 8,
    borderRadius: 12,
    marginBottom: 8,
  },
  profitIcon: {
    backgroundColor: `${COLORS.success}20`,
  },
  winRateIcon: {
    backgroundColor: `${COLORS.primary}20`,
  },
  profitFactorIcon: {
    backgroundColor: `${COLORS.warning}20`,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text.primary,
    marginVertical: 4,
    textAlign: 'center',
  },
  metricLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.text.secondary,
    textAlign: 'center',
  },

  // Chart Cards
  chartCard: {
    backgroundColor: COLORS.cardBg,
    margin: 16,
    padding: 20,
    borderRadius: 24,
    ...shadowStyle,
  },
  chartTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text.primary,
    marginBottom: 20,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  chartLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    marginTop: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 12,
    marginVertical: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
    color: COLORS.text.secondary,
    fontWeight: '500',
  },

  // Stats Card
  statsCard: {
    backgroundColor: COLORS.cardBg,
    margin: 16,
    padding: 20,
    borderRadius: 24,
    ...shadowStyle,
  },
  statsTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text.primary,
    marginBottom: 20,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  statLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.text.secondary,
  },
  statValue: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  positiveValue: {
    color: COLORS.success,
  },
  negativeValue: {
    color: COLORS.danger,
  },

  // Additional Enhancement Styles
  refreshIndicator: {
    color: COLORS.primary,
  },
  noDataContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  noDataText: {
    fontSize: 16,
    color: COLORS.text.secondary,
    textAlign: 'center',
    marginTop: 12,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text.secondary,
    marginHorizontal: 16,
    marginTop: 24,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  tooltipContainer: {
    backgroundColor: COLORS.cardBg,
    padding: 12,
    borderRadius: 12,
    ...shadowStyle,
  },
  tooltipText: {
    fontSize: 14,
    color: COLORS.text.primary,
    fontWeight: '500',
  },
  
  // Animation Properties
  fadeInUp: {
    opacity: 1,
    transform: [{ translateY: 0 }],
  },
  fadeInUpInitial: {
    opacity: 0,
    transform: [{ translateY: 20 }],
  },
  
  // Platform Specific Adjustments
  ...Platform.select({
    ios: {
      timeFrameButton: {
        shadowColor: COLORS.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
    },
    android: {
      timeFrameButton: {
        elevation: 3,
      },
    },
  }),
});

// Animation configurations
export const animationConfig = {
  duration: 300,
  easing: Easing.bezier(0.4, 0, 0.2, 1),
};