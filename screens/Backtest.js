import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function Backtest({ route, navigation }) {
  const { strategyId } = route.params;
  const [strategy, setStrategy] = useState(null);
  const [backtestResult, setBacktestResult] = useState({
    entryPrice: '',
    exitPrice: '',
    date: '',
    outcome: '',
    pnl: '',
    notes: ''
  });

  useEffect(() => {
    loadStrategy();
  }, []);

  const loadStrategy = async () => {
    try {
      const storedStrategies = await AsyncStorage.getItem('forex_strategies');
      if (storedStrategies) {
        const strategies = JSON.parse(storedStrategies);
        const found = strategies.find(s => s.id === strategyId);
        if (found) {
          setStrategy(found);
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load strategy');
    }
  };

  const saveBacktest = async () => {
    if (!backtestResult.entryPrice || !backtestResult.exitPrice || !backtestResult.date) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      const storedStrategies = await AsyncStorage.getItem('forex_strategies');
      if (storedStrategies) {
        const strategies = JSON.parse(storedStrategies);
        const strategyIndex = strategies.findIndex(s => s.id === strategyId);
        
        if (strategyIndex !== -1) {
          const updatedStrategy = {
            ...strategies[strategyIndex],
            backtestCount: strategies[strategyIndex].backtestCount + 1,
            backtestResults: [
              ...strategies[strategyIndex].backtestResults,
              {
                ...backtestResult,
                id: Date.now().toString()
              }
            ]
          };

          // Check if strategy should be verified
          if (updatedStrategy.backtestCount >= 100) {
            updatedStrategy.isVerified = true;
          }

          strategies[strategyIndex] = updatedStrategy;
          await AsyncStorage.setItem('forex_strategies', JSON.stringify(strategies));
          setStrategy(updatedStrategy);
          setBacktestResult({
            entryPrice: '',
            exitPrice: '',
            date: '',
            outcome: '',
            pnl: '',
            notes: ''
          });
          Alert.alert('Success', 'Backtest saved successfully');
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to save backtest');
    }
  };

  if (!strategy) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView>
        <View style={styles.strategyInfo}>
          <Text style={styles.title}>{strategy.name}</Text>
          <Text style={styles.progress}>
            Backtests: {strategy.backtestCount}/100
            {strategy.isVerified && ' ✓ Verified'}
          </Text>
        </View>

        <View style={styles.backtestForm}>
          <Text style={styles.subtitle}>Add New Backtest</Text>
          
          <TextInput
            style={styles.input}
            placeholder="Entry Price"
            keyboardType="numeric"
            value={backtestResult.entryPrice}
            onChangeText={(text) => setBacktestResult({...backtestResult, entryPrice: text})}
          />
          
          <TextInput
            style={styles.input}
            placeholder="Exit Price"
            keyboardType="numeric"
            value={backtestResult.exitPrice}
            onChangeText={(text) => setBacktestResult({...backtestResult, exitPrice: text})}
          />
          
          <TextInput
            style={styles.input}
            placeholder="Date (YYYY-MM-DD)"
            value={backtestResult.date}
            onChangeText={(text) => setBacktestResult({...backtestResult, date: text})}
          />
          
          <TextInput
            style={styles.input}
            placeholder="Outcome (Win/Loss)"
            value={backtestResult.outcome}
            onChangeText={(text) => setBacktestResult({...backtestResult, outcome: text})}
          />
          
          <TextInput
            style={styles.input}
            placeholder="P&L (%)"
            keyboardType="numeric"
            value={backtestResult.pnl}
            onChangeText={(text) => setBacktestResult({...backtestResult, pnl: text})}
          />
          
          <TextInput
            style={[styles.input, styles.multilineInput]}
            placeholder="Notes"
            multiline
            value={backtestResult.notes}
            onChangeText={(text) => setBacktestResult({...backtestResult, notes: text})}
          />

          <TouchableOpacity 
            style={[styles.button, !strategy.isVerified ? styles.buttonEnabled : styles.buttonDisabled]}
            onPress={saveBacktest}
            disabled={strategy.isVerified}
          >
            <Text style={styles.buttonText}>
              {strategy.isVerified ? 'Strategy Verified' : 'Save Backtest'}
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.subtitle}>Backtest History</Text>
        <ScrollView style={styles.historyList}>
          {strategy.backtestResults.map((result) => (
            <View key={result.id} style={styles.historyCard}>
              <Text style={styles.historyDate}>{result.date}</Text>
              <Text>Entry: {result.entryPrice} | Exit: {result.exitPrice}</Text>
              <Text style={styles.historyOutcome}>
                {result.outcome} ({result.pnl}%)
              </Text>
              {result.notes && <Text style={styles.historyNotes}>{result.notes}</Text>}
            </View>
          ))}
        </ScrollView>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  strategyInfo: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  progress: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
  },
  subtitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  backtestForm: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  input: {
    backgroundColor: '#f8f8f8',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  multilineInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  button: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonEnabled: {
    backgroundColor: '#2196F3',
  },
  buttonDisabled: {
    backgroundColor: '#90CAF9',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  historyList: {
    maxHeight: 300,
  },
  historyCard: {
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  historyDate: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  historyOutcome: {
    marginTop: 4,
    fontWeight: '500',
  },
  historyNotes: {
    marginTop: 4,
    fontStyle: 'italic',
    color: '#666',
  },
});