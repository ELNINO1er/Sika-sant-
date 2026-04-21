import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { APP_NAME, API_URL } from '../config/env';
import { getHealth } from '../services/api';

export function HomeScreen() {
  const [status, setStatus] = useState('Base mobile creee. Pret pour votre template.');
  const [loading, setLoading] = useState(false);

  async function handleCheckApi() {
    setLoading(true);

    try {
      const response = await getHealth();
      const serviceStatus = response?.data?.status || 'ok';
      setStatus(`Backend joignable: ${serviceStatus}`);
    } catch (error) {
      setStatus(error.message || 'Connexion backend echouee');
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.screen}>
      <View style={styles.hero}>
        <Text style={styles.eyebrow}>React Native + Expo</Text>
        <Text style={styles.title}>{APP_NAME}</Text>
        <Text style={styles.subtitle}>
          Structure minimale prete pour brancher votre futur template sur le backend existant.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>API actuelle</Text>
        <Text style={styles.value}>{API_URL}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Etat</Text>
        <Text style={styles.value}>{status}</Text>
      </View>

      <Pressable
        accessibilityRole="button"
        onPress={handleCheckApi}
        style={({ pressed }) => [
          styles.button,
          pressed && styles.buttonPressed,
          loading && styles.buttonDisabled,
        ]}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Verification...' : 'Tester le backend'}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 24,
    justifyContent: 'center',
    gap: 16,
  },
  hero: {
    gap: 8,
  },
  eyebrow: {
    color: '#0f766e',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  title: {
    color: '#0f172a',
    fontSize: 32,
    fontWeight: '800',
  },
  subtitle: {
    color: '#475569',
    fontSize: 16,
    lineHeight: 24,
  },
  card: {
    backgroundColor: '#ffffff',
    borderColor: '#dbe4ee',
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    gap: 6,
  },
  label: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  value: {
    color: '#0f172a',
    fontSize: 16,
    lineHeight: 24,
  },
  button: {
    alignItems: 'center',
    backgroundColor: '#0f766e',
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  buttonPressed: {
    opacity: 0.88,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
});
