import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';

export default function Strategies({ navigation }) {
  const [strategies, setStrategies] = useState([]);
  const [newStrategy, setNewStrategy] = useState({
    name: '',
    description: '',
    entryRules: '',
    exitRules: '',
    riskPerTrade: '',
    timeframe: '',
    winLossCondition: 'Win', // Default value for win/loss condition
  });

  useEffect(() => {
    loadStrategies();
  }, []);

  const loadStrategies = async () => {
    try {
      const storedStrategies = await AsyncStorage.getItem('forex_strategies');
      if (storedStrategies) {
        setStrategies(JSON.parse(storedStrategies));
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load strategies');
    }
  };

  const saveStrategy = async () => {
    if (!newStrategy.name || !newStrategy.entryRules || !newStrategy.exitRules) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      const strategyToSave = {
        ...newStrategy,
        id: Date.now().toString(),
        backtestCount: 0,
        isVerified: false,
        backtestResults: [],
      };

      const updatedStrategies = [...strategies, strategyToSave];
      await AsyncStorage.setItem('forex_strategies', JSON.stringify(updatedStrategies));
      setStrategies(updatedStrategies);
      setNewStrategy({
        name: '',
        description: '',
        entryRules: '',
        exitRules: '',
        riskPerTrade: '',
        timeframe: '',
        winLossCondition: 'Win', // Reset picker to default value
      });
      Alert.alert('Success', 'Strategy saved successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to save strategy');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create Trading Strategy</Text>
      
      <ScrollView style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Strategy Name"
          value={newStrategy.name}
          onChangeText={(text) => setNewStrategy({ ...newStrategy, name: text })}
        />
        
        <TextInput
          style={styles.input}
          placeholder="Description"
          multiline
          value={newStrategy.description}
          onChangeText={(text) => setNewStrategy({ ...newStrategy, description: text })}
        />
        
        <TextInput
          style={[styles.input, styles.multilineInput]}
          placeholder="Entry Rules"
          multiline
          value={newStrategy.entryRules}
          onChangeText={(text) => setNewStrategy({ ...newStrategy, entryRules: text })}
        />
        
        <TextInput
          style={[styles.input, styles.multilineInput]}
          placeholder="Exit Rules"
          multiline
          value={newStrategy.exitRules}
          onChangeText={(text) => setNewStrategy({ ...newStrategy, exitRules: text })}
        />
        
        <TextInput
          style={styles.input}
          placeholder="Risk Per Trade (%)"
          keyboardType="numeric"
          value={newStrategy.riskPerTrade}
          onChangeText={(text) => setNewStrategy({ ...newStrategy, riskPerTrade: text })}
        />
        
        <TextInput
          style={styles.input}
          placeholder="Timeframe"
          value={newStrategy.timeframe}
          onChangeText={(text) => setNewStrategy({ ...newStrategy, timeframe: text })}
        />

        <Text style={styles.label}>Win/Loss Condition</Text>
        <Picker
          selectedValue={newStrategy.winLossCondition}
          style={styles.picker}
          onValueChange={(itemValue) => setNewStrategy({ ...newStrategy, winLossCondition: itemValue })}
        >
          <Picker.Item label="Win" value="Win" />
          <Picker.Item label="Loss" value="Loss" />
        </Picker>

        <TouchableOpacity style={styles.button} onPress={saveStrategy}>
          <Text style ={styles.buttonText}>Save Strategy</Text>
        </TouchableOpacity>
      </ScrollView>

      <Text style={styles.subtitle}>Your Strategies</Text>
      <ScrollView style={styles.strategiesList}>
        {strategies.map((strategy) => (
          <TouchableOpacity
            key={strategy.id}
            style={styles.strategyCard}
            onPress={() => navigation.navigate('Backtest', { strategyId: strategy.id })}
          >
            <Text style={styles.strategyName}>{strategy.name}</Text>
            <Text style={styles.strategyStatus}>
              Backtests: {strategy.backtestCount}/100
              {strategy.isVerified && ' ✓ Verified'}
            </Text>
          </TouchableOpacity>
        ))}
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  subtitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
    color: '#333',
  },
  form: {
    maxHeight: '50%',
  },
  input: {
    backgroundColor: 'white',
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
  label: {
    fontSize: 16,
    marginBottom: 8,
    color: '#333',
  },
  picker: {
    height: 50,
    width: '100%',
    backgroundColor: 'white',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 12,
  },
  button: {
    backgroundColor: '#2196F3',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  strategiesList: {
    flex: 1,
  },
  strategyCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  strategyName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  strategyStatus: {
    marginTop: 4,
    color: '#666',
  },
});