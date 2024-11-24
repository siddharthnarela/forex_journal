import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  FlatList,
  Modal,
  TextInput,
  ScrollView,
  Alert
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Picker } from '@react-native-picker/picker';
import TradeCard from '../widgets/TradeCard';

export default function Trades() {
  const [trades, setTrades] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [closeTradeModal, setCloseTradeModal] = useState(false);
  const [selectedTrade, setSelectedTrade] = useState(null);
  const [timeFilter, setTimeFilter] = useState('all'); // all, today, week, month
  
  const [newTrade, setNewTrade] = useState({
    pair: '',
    type: '',
    entryPrice: '',
    exitPrice: '',
    lotSize: '',
    stopLoss: '',
    takeProfit: '',
    notes: '',
    entryTime: '',
    exitTime: '',
    closeReason: '',
    riskRewardRatio: '',
  });

  const closeReasons = [
    'Take Profit Hit',
    'Stop Loss Hit',
    'Manual Close - Profit',
    'Manual Close - Loss',
    'Technical Analysis',
    'News Impact',
    'Risk Management'
  ];

  const riskRewardRatios = [
    '1:1', '1:2', '1:3', '1:4', '1:5'
  ];

  // Forex Major Pairs
  const forexPairs = [
    'EUR/USD', 'GBP/USD', 'USD/JPY', 'USD/CHF',
    'USD/CAD', 'AUD/USD', 'NZD/USD'
  ];

  useEffect(() => {
    loadTrades();
  }, []);

  const loadTrades = async () => {
    try {
      const storedTrades = await AsyncStorage.getItem('trades');
      if (storedTrades) {
        const parsedTrades = JSON.parse(storedTrades);
        // Sort trades by entry time, most recent first
        const sortedTrades = parsedTrades.sort((a, b) => 
          new Date(b.entryTime) - new Date(a.entryTime)
        );
        setTrades(sortedTrades);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load trades');
    }
  };

  const filterTradesByTime = (tradesArray) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(now.setDate(now.getDate() - 7));
    const monthAgo = new Date(now.setMonth(now.getMonth() - 1));

    switch (timeFilter) {
      case 'today':
        return tradesArray.filter(trade => new Date(trade.entryTime) >= today);
      case 'week':
        return tradesArray.filter(trade => new Date(trade.entryTime) >= weekAgo);
      case 'month':
        return tradesArray.filter(trade => new Date(trade.entryTime) >= monthAgo);
      default:
        return tradesArray;
    }
  };

  const saveTrade = async () => {
    if (!newTrade.pair || !newTrade.type || !newTrade.entryPrice) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      const trade = {
        ...newTrade,
        id: Date.now().toString(),
        entryTime: new Date().toISOString(),
        status: 'OPEN'
      };

      const updatedTrades = [...trades, trade].sort((a, b) => 
        new Date(b.entryTime) - new Date(a.entryTime)
      );
      await AsyncStorage.setItem('trades', JSON.stringify(updatedTrades));
      setTrades(updatedTrades);
      setModalVisible(false);
      resetNewTrade();
    } catch (error) {
      Alert.alert('Error', 'Failed to save trade');
    }
  };

  const initializeClosePosition = (trade) => {
    setSelectedTrade(trade);
    setCloseTradeModal(true);
  };

  const closeTrade = async () => {
    if (!selectedTrade.exitPrice || !selectedTrade.closeReason || !selectedTrade.riskRewardRatio) {
      Alert.alert('Error', 'Please fill in all closing details');
      return;
    }

    try {
      const updatedTrades = trades.map(trade => {
        if (trade.id === selectedTrade.id) {
          return {
            ...trade,
            ...selectedTrade,
            exitTime: new Date().toISOString(),
            status: 'CLOSED',
          };
        }
        return trade;
      });

      await AsyncStorage.setItem('trades', JSON.stringify(updatedTrades));
      setTrades(updatedTrades);
      setCloseTradeModal(false);
      setSelectedTrade(null);
    } catch (error) {
      Alert.alert('Error', 'Failed to close trade');
    }
  };

  const resetNewTrade = () => {
    setNewTrade({
      pair: '',
      type: '',
      entryPrice: '',
      exitPrice: '',
      lotSize: '',
      stopLoss: '',
      takeProfit: '',
      notes: '',
      entryTime: '',
      exitTime: '',
      closeReason: '',
      riskRewardRatio: '',
    });
  };

  const calculatePnL = (trade) => {
    if (trade.status !== 'CLOSED' || !trade.exitPrice) return null;
    
    const entry = parseFloat(trade.entryPrice);
    const exit = parseFloat(trade.exitPrice);
    const lots = parseFloat(trade.lotSize);
    
    if (trade.type === 'BUY') {
      return ((exit - entry) * lots * 100000).toFixed(2);
    } else {
      return ((entry - exit) * lots * 100000).toFixed(2);
    }
  };

  const renderTradeItem = ({ item }) => (
    <TradeCard 
    item={item}
    onClosePosition={initializeClosePosition}
    calculatePnL={calculatePnL}
  />
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Trading Journal</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => setModalVisible(true)}
        >
          <MaterialCommunityIcons name="plus" size={24} color="white" />
        </TouchableOpacity>
      </View>

      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterButton, timeFilter === 'all' && styles.filterButtonActive]}
          onPress={() => setTimeFilter('all')}
        >
          <Text style={styles.filterButtonText}>All</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, timeFilter === 'today' && styles.filterButtonActive]}
          onPress={() => setTimeFilter('today')}
        >
          <Text style={styles.filterButtonText}>Today</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, timeFilter === 'week' && styles.filterButtonActive]}
          onPress={() => setTimeFilter('week')}
        >
          <Text style={styles.filterButtonText}>This Week</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, timeFilter === 'month' && styles.filterButtonActive]}
          onPress={() => setTimeFilter('month')}
        >
          <Text style={styles.filterButtonText}>This Month</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={filterTradesByTime(trades)}
        renderItem={renderTradeItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContainer}
      />

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>New Trade</Text>

            <ScrollView>
              <Text style={styles.inputLabel}>Pair</Text>
              <View style={styles.pairSelector}>
                {forexPairs.map((pair) => (
                  <TouchableOpacity
                    key={pair}
                    style={[
                      styles.pairButton,
                      newTrade.pair === pair && styles.selectedPairButton
                    ]}
                    onPress={() => setNewTrade({...newTrade, pair})}
                  >
                    <Text style={[
                      styles.pairButtonText,
                      newTrade.pair === pair && styles.selectedPairButtonText
                    ]}>
                      {pair}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.inputLabel}>Type</Text>
              <View style={styles.typeButtons}>
                <TouchableOpacity
                  style={[
                    styles.typeButton,
                    newTrade.type === 'BUY' && styles.selectedBuyButton
                  ]}
                  onPress={() => setNewTrade({...newTrade, type: 'BUY'})}
                >
                  <Text style={styles.typeButtonText}>BUY</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.typeButton,
                    newTrade.type === 'SELL' && styles.selectedSellButton
                  ]}
                  onPress={() => setNewTrade({...newTrade, type: 'SELL'})}
                >
                  <Text style={styles.typeButtonText}>SELL</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.inputLabel}>Entry Price</Text>
              <TextInput
                style={styles.input}
                value={newTrade.entryPrice}
                onChangeText={(text) => setNewTrade({...newTrade, entryPrice: text})}
                keyboardType="decimal-pad"
                placeholder="Enter price"
              />

              <Text style={styles.inputLabel}>Lot Size</Text>
              <TextInput
                style={styles.input}
                value={newTrade.lotSize}
                onChangeText={(text) => setNewTrade({...newTrade, lotSize: text})}
                keyboardType="decimal-pad"
                placeholder="Enter lot size"
              />

              <Text style={styles.inputLabel}>Stop Loss</Text>
              <TextInput
                style={styles.input}
                value={newTrade.stopLoss}
                onChangeText={(text) => setNewTrade({...newTrade, stopLoss: text})}
                keyboardType="decimal-pad"
                placeholder="Enter stop loss"
              />

              <Text style={styles.inputLabel}>Take Profit</Text>
              <TextInput
                style={styles.input}
                value={newTrade.takeProfit}
                onChangeText={(text) => setNewTrade({...newTrade, takeProfit: text})}
                keyboardType="decimal-pad"
                placeholder="Enter take profit"
              />

              <Text style={styles.inputLabel}>Notes</Text>
              <TextInput
                style={[styles.input, styles.notesInput]}
                value={newTrade.notes}
                onChangeText={(text) => setNewTrade({...newTrade, notes: text})}
                multiline
                placeholder="Enter trade notes"
              />

              <View style={styles.modalButtons}>
                <TouchableOpacity 
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => {
                    setModalVisible(false);
                    resetNewTrade();
                  }}
                >
                  <Text style={styles.modalButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.modalButton, styles.saveButton]}
                  onPress={saveTrade}
                >
                  <Text style={styles.modalButtonText}>Save Trade</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
      <Modal
        animationType="slide"
        transparent={true}
        visible={closeTradeModal}
        onRequestClose={() => setCloseTradeModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Close Trade</Text>

            <ScrollView>
              <Text style={styles.inputLabel}>Exit Price</Text>
              <TextInput
                style={styles.input}
                value={selectedTrade?.exitPrice}
                onChangeText={(text) => setSelectedTrade({...selectedTrade, exitPrice: text})}
                keyboardType="decimal-pad"
                placeholder="Enter exit price"
              />

              <Text style={styles.inputLabel}>Close Reason</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={selectedTrade?.closeReason}
                  style={styles.picker}
                  onValueChange={(itemValue) => 
                    setSelectedTrade({...selectedTrade, closeReason: itemValue})
                  }
                >
                  <Picker.Item label="Select reason" value="" />
                  {closeReasons.map((reason) => (
                    <Picker.Item key={reason} label={reason} value={reason} />
                  ))}
                </Picker>
              </View>

              <Text style={styles.inputLabel}>Risk:Reward Ratio</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={selectedTrade?.riskRewardRatio}
                  style={styles.picker}
                  onValueChange={(itemValue) =>
                    setSelectedTrade({...selectedTrade, riskRewardRatio: itemValue})
                  }
                >
                  <Picker.Item label="Select R:R ratio" value="" />
                  {riskRewardRatios.map((ratio) => (
                    <Picker.Item key={ratio} label={ratio} value={ratio} />
                  ))}
                </Picker>
              </View>

              <View style={styles.modalButtons}>
                <TouchableOpacity 
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => {
                    setCloseTradeModal(false);
                    setSelectedTrade(null);
                  }}
                >
                  <Text style={styles.modalButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.modalButton, styles.saveButton]}
                  onPress={closeTrade}
                >
                  <Text style={styles.modalButtonText}>Close Trade</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E4E9F2',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2E3A59',
  },
  addButton: {
    backgroundColor: '#3366FF',
    padding: 12,
    borderRadius: 12,
    elevation: 3,
    shadowColor: '#3366FF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  listContainer: {
    padding: 12,
  },
  tradeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: '#E4E9F2',
  },
  tradeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  pairText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2E3A59',
    letterSpacing: 0.5,
  },
  typeTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  typeText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 13,
  },
  tradeDetails: {
    marginVertical: 12,
    backgroundColor: '#F7F9FC',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E4E9F2',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  label: {
    color: '#8F9BB3',
    fontSize: 14,
    fontWeight: '500',
  },
  value: {
    color: '#2E3A59',
    fontWeight: '600',
    fontSize: 14,
  },
  tradeFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E4E9F2',
  },
  statusText: {
    fontWeight: 'bold',
    fontSize: 14,
    textTransform: 'uppercase',
  },
  pnlText: {
    fontWeight: 'bold',
    fontSize: 16,
    letterSpacing: 0.5,
  },
  closeButton: {
    backgroundColor: '#3366FF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#3366FF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '90%',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2E3A59',
    marginBottom: 20,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  inputLabel: {
    color: '#8F9BB3',
    marginBottom: 6,
    marginTop: 12,
    fontSize: 14,
    fontWeight: '500',
  },
  input: {
    backgroundColor: '#F7F9FC',
    borderRadius: 12,
    padding: 12,
    color: '#2E3A59',
    marginBottom: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E4E9F2',
  },
  notesInput: {
    height: 100,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
    marginBottom: 20,
  },
  modalButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 6,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  cancelButton: {
    backgroundColor: '#F7F9FC',
    borderWidth: 1,
    borderColor: '#E4E9F2',
  },
  saveButton: {
    backgroundColor: '#3366FF',
  },
  modalButtonText: {
    color: '#2E3A59',
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 16,
  },
  saveButtonText: {
    color: '#FFFFFF',
  },
  pairSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
    justifyContent: 'flex-start',
  },
  pairButton: {
    backgroundColor: '#F7F9FC',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    margin: 4,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    borderWidth: 1,
    borderColor: '#E4E9F2',
  },
  selectedPairButton: {
    backgroundColor: '#3366FF',
    borderColor: '#3366FF',
  },
  pairButtonText: {
    color: '#2E3A59',
    fontSize: 14,
    fontWeight: '500',
  },
  selectedPairButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  typeButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  typeButton: {
    flex: 1,
    backgroundColor: '#F7F9FC',
    padding: 14,
    borderRadius: 12,
    marginHorizontal: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E4E9F2',
  },
  selectedBuyButton: {
    backgroundColor: '#00E096',
    borderColor: '#00E096',
  },
  selectedSellButton: {
    backgroundColor: '#FF3D71',
    borderColor: '#FF3D71',
  },
  typeButtonText: {
    color: '#2E3A59',
    fontWeight: 'bold',
    fontSize: 16,
  },
  selectedTypeButtonText: {
    color: '#FFFFFF',
  },
  filterContainer: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E4E9F2',
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginHorizontal: 4,
    backgroundColor: '#F7F9FC',
    borderWidth: 1,
    borderColor: '#E4E9F2',
  },
  filterButtonActive: {
    backgroundColor: '#3366FF',
    borderColor: '#3366FF',
  },
  filterButtonText: {
    color: '#2E3A59',
    fontSize: 14,
    fontWeight: '500',
  },
  filterButtonActiveText: {
    color: '#FFFFFF',
  },
  pickerContainer: {
    backgroundColor: '#F7F9FC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E4E9F2',
    marginBottom: 16,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
    color: '#2E3A59',
  },
  errorText: {
    color: '#FF3D71',
    fontSize: 12,
    marginTop: -8,
    marginBottom: 12,
    marginLeft: 4,
  },
  timeStampText: {
    color: '#8F9BB3',
    fontSize: 12,
    marginTop: 6,
  },
  profitBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  profitText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 12,
  },
  noTradesContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  noTradesText: {
    color: '#8F9BB3',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 12,
  },
  searchContainer: {
    padding: 12,
    backgroundColor: '#FFFFFF',
  },
  searchInput: {
    backgroundColor: '#F7F9FC',
    borderRadius: 12,
    padding: 12,
    color: '#2E3A59',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E4E9F2',
  },
  dateText: {
    color: '#8F9BB3',
    fontSize: 12,
    marginTop: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E4E9F2',
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    color: '#8F9BB3',
    fontSize: 12,
    marginBottom: 4,
  },
  statValue: {
    color: '#2E3A59',
    fontSize: 16,
    fontWeight: 'bold',
  },
  chartContainer: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginBottom: 12,
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2E3A59',
    marginBottom: 12,
    marginLeft: 12,
    marginTop: 16,
  },
});