import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  LayoutAnimation,
  Platform,
  UIManager,
  Alert,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { refineText } from '../services/api';
import { getStoredOpenAIKey } from './ProfileScreen';
import type { Refinement } from '../types';

// Android에서 LayoutAnimation 활성화
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function RefineScreen() {
  const [inputText, setInputText] = useState('');
  const [context, setContext] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Refinement | null>(null);
  const [selectedSuggestion, setSelectedSuggestion] = useState<number>(0);

  const handleRefine = async () => {
    if (!inputText.trim()) {
      Alert.alert('알림', '다듬을 텍스트를 입력해주세요.');
      return;
    }

    try {
      setLoading(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      // 저장된 OpenAI API 키 가져오기
      const openaiApiKey = await getStoredOpenAIKey();

      const response = await refineText(
        {
          text: inputText.trim(),
          context: context.trim() || undefined,
        },
        openaiApiKey // API 키가 있으면 OpenAI 사용, 없으면 Ollama 사용
      );

      if (response.success && response.data) {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setResult(response.data);
        setSelectedSuggestion(0);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        // 어떤 AI를 사용했는지 표시 (선택사항)
        console.log(`AI Provider: ${response.data.provider || 'unknown'}`);
      } else {
        Alert.alert('오류', response.message || '텍스트 다듬기에 실패했습니다.');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } catch (error: any) {
      console.error('Refine error:', error);
      const errorMessage = error.response?.data?.message || error.message || '서버와 연결할 수 없습니다.';
      Alert.alert('오류', errorMessage);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setInputText('');
    setContext('');
    setResult(null);
    setSelectedSuggestion(0);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleSelectSuggestion = (index: number) => {
    setSelectedSuggestion(index);
    Haptics.selectionAsync();
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <Text style={styles.title}>Refine</Text>
        <Text style={styles.subtitle}>공적인 상황에 맞는 표현으로 다듬어드립니다</Text>
      </View>

      <View style={styles.inputSection}>
        <Text style={styles.label}>상황 (선택사항)</Text>
        <TextInput
          style={styles.contextInput}
          placeholder="예: 교수님께 메일, 거래처에 제안"
          value={context}
          onChangeText={setContext}
          editable={!loading}
        />

        <Text style={styles.label}>다듬을 문장</Text>
        <TextInput
          style={styles.textInput}
          placeholder="다듬고 싶은 문장을 입력해주세요..."
          value={inputText}
          onChangeText={setInputText}
          multiline
          numberOfLines={4}
          editable={!loading}
        />

        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.button, styles.resetButton]}
            onPress={handleReset}
            disabled={loading}
          >
            <Text style={styles.resetButtonText}>초기화</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.refineButton, loading && styles.buttonDisabled]}
            onPress={handleRefine}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.refineButtonText}>다듬기</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {result && result.suggestions && result.suggestions.length > 0 && (
        <View style={styles.resultSection}>
          <Text style={styles.resultTitle}>다듬어진 표현</Text>

          {result.suggestions.map((suggestion, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.suggestionCard,
                selectedSuggestion === index && styles.suggestionCardSelected,
              ]}
              onPress={() => handleSelectSuggestion(index)}
            >
              <View style={styles.suggestionHeader}>
                <Text style={styles.suggestionNumber}>옵션 {index + 1}</Text>
                {selectedSuggestion === index && (
                  <Text style={styles.selectedBadge}>선택됨</Text>
                )}
              </View>
              <Text style={styles.suggestionText}>{suggestion}</Text>
            </TouchableOpacity>
          ))}

          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              💡 각 옵션을 탭하여 선택할 수 있습니다
            </Text>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  contentContainer: {
    padding: 20,
  },
  header: {
    marginBottom: 30,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#6c757d',
    textAlign: 'center',
  },
  inputSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#495057',
    marginBottom: 8,
  },
  contextInput: {
    borderWidth: 1,
    borderColor: '#dee2e6',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    backgroundColor: '#f8f9fa',
    marginBottom: 20,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#dee2e6',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    backgroundColor: '#f8f9fa',
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetButton: {
    backgroundColor: '#e9ecef',
  },
  resetButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#495057',
  },
  refineButton: {
    backgroundColor: '#0d6efd',
  },
  refineButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  resultSection: {
    marginBottom: 20,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 16,
  },
  suggestionCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#dee2e6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  suggestionCardSelected: {
    borderColor: '#0d6efd',
    backgroundColor: '#f0f7ff',
  },
  suggestionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  suggestionNumber: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6c757d',
  },
  selectedBadge: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0d6efd',
    backgroundColor: '#cfe2ff',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  suggestionText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#212529',
  },
  infoBox: {
    backgroundColor: '#fff3cd',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  infoText: {
    fontSize: 13,
    color: '#856404',
  },
});
