import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  Animated, 
  StyleSheet,
  LayoutAnimation,
  Platform,
  UIManager 
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// Enable LayoutAnimation for Android
if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

const TradeCard = ({ item, onClosePosition, calculatePnL }) => {
  const [expanded, setExpanded] = useState(false);
  const [rotateAnimation] = useState(new Animated.Value(0));

  const toggleExpand = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(!expanded);
    Animated.timing(rotateAnimation, {
      toValue: expanded ? 0 : 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  const spin = rotateAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg']
  });

  const isProfitable = calculatePnL(item) >= 0;
  const isBuy = item.type === 'BUY';

  return (
    <View style={styles.card}>
      {/* Header Section - Always Visible */}
      <TouchableOpacity 
        style={styles.header} 
        onPress={toggleExpand}
        activeOpacity={0.7}
      >
        <View style={styles.headerLeft}>
          <View style={[
            styles.typeIcon,
            { backgroundColor: isBuy ? 'rgba(52, 211, 153, 0.1)' : 'rgba(248, 113, 113, 0.1)' }
          ]}>
            <MaterialCommunityIcons 
              name={isBuy ? 'trending-up' : 'trending-down'} 
              size={24} 
              color={isBuy ? '#34D399' : '#F87171'}
            />
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.pairText}>{item.pair}</Text>
            <Text style={styles.subText}>
              {item.lotSize} lots • {item.status}
            </Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          {item.status === 'CLOSED' && (
            <Text style={[
              styles.pnlText,
              { color: isProfitable ? '#34D399' : '#F87171' }
            ]}>
              {calculatePnL(item)} USD
            </Text>
          )}
          <Animated.View style={{ transform: [{ rotate: spin }] }}>
            <MaterialCommunityIcons 
              name="chevron-down" 
              size={24} 
              color="#9CA3AF"
            />
          </Animated.View>
        </View>
      </TouchableOpacity>

      {/* Expandable Details Section */}
      {expanded && (
        <View style={styles.details}>
          <View style={styles.detailRow}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Entry Price</Text>
              <Text style={styles.detailValue}>{item.entryPrice}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Exit Price</Text>
              <Text style={styles.detailValue}>{item.exitPrice || '-'}</Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Stop Loss</Text>
              <Text style={styles.detailValue}>{item.stopLoss || '-'}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Take Profit</Text>
              <Text style={styles.detailValue}>{item.takeProfit || '-'}</Text>
            </View>
          </View>

          {item.status === 'CLOSED' && (
            <>
              <View style={styles.divider} />
              <View style={styles.detailRow}>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Close Reason</Text>
                  <Text style={styles.detailValue}>{item.closeReason}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>R:R Ratio</Text>
                  <Text style={styles.detailValue}>{item.riskRewardRatio}</Text>
                </View>
              </View>
            </>
          )}

          {item.status === 'OPEN' && (
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => onClosePosition(item)}
            >
              <Text style={styles.closeButtonText}>Close Position</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginHorizontal: 1,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typeIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerInfo: {
    justifyContent: 'center',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pairText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  subText: {
    fontSize: 14,
    color: '#6B7280',
  },
  pnlText: {
    fontSize: 16,
    fontWeight: '600',
    marginRight: 12,
  },
  details: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  detailItem: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 16,
  },
  closeButton: {
    backgroundColor: '#3B82F6',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default TradeCard;