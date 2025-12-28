import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { getHistory, deleteRefinement } from '../services/api';
import type { Refinement } from '../types';

export default function HistoryScreen() {
  const [history, setHistory] = useState<Refinement[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadHistory = async () => {
    try {
      const response = await getHistory(50);
      if (response.success && response.data) {
        setHistory(response.data);
      }
    } catch (error) {
      console.error('히스토리 로드 실패:', error);
      Alert.alert('오류', '히스토리를 불러올 수 없습니다.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    loadHistory();
  }, []);

  const handleDelete = (id: number) => {
    Alert.alert(
      '삭제 확인',
      '이 항목을 삭제하시겠습니까?',
      [
        {
          text: '취소',
          style: 'cancel',
        },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            try {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              await deleteRefinement(id);
              setHistory(prev => prev.filter(item => item.id !== id));
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } catch (error) {
              console.error('삭제 실패:', error);
              Alert.alert('오류', '삭제에 실패했습니다.');
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return '방금 전';
    if (diffMins < 60) return `${diffMins}분 전`;
    if (diffHours < 24) return `${diffHours}시간 전`;
    if (diffDays < 7) return `${diffDays}일 전`;

    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const renderItem = ({ item }: { item: Refinement }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.dateText}>{formatDate(item.createdAt)}</Text>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDelete(item.id)}
        >
          <Text style={styles.deleteButtonText}>삭제</Text>
        </TouchableOpacity>
      </View>

      {item.context && (
        <View style={styles.contextBadge}>
          <Text style={styles.contextText}>{item.context}</Text>
        </View>
      )}

      <View style={styles.textSection}>
        <Text style={styles.sectionLabel}>원본</Text>
        <Text style={styles.originalText}>{item.originalText}</Text>
      </View>

      <View style={styles.divider} />

      <View style={styles.textSection}>
        <Text style={styles.sectionLabel}>다듬어진 표현</Text>
        <Text style={styles.refinedText}>{item.refinedText}</Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#0d6efd" />
        <Text style={styles.loadingText}>히스토리를 불러오는 중...</Text>
      </View>
    );
  }

  if (history.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyIcon}>📝</Text>
        <Text style={styles.emptyText}>아직 히스토리가 없습니다</Text>
        <Text style={styles.emptySubtext}>
          메인 화면에서 문장을 다듬어보세요
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={history}
        renderItem={renderItem}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#0d6efd"
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6c757d',
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#495057',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6c757d',
    textAlign: 'center',
  },
  listContainer: {
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dateText: {
    fontSize: 12,
    color: '#6c757d',
    fontWeight: '500',
  },
  deleteButton: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: '#f8d7da',
  },
  deleteButtonText: {
    fontSize: 12,
    color: '#842029',
    fontWeight: '600',
  },
  contextBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#e7f3ff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 12,
  },
  contextText: {
    fontSize: 11,
    color: '#0c5ba0',
    fontWeight: '600',
  },
  textSection: {
    marginBottom: 12,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6c757d',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  originalText: {
    fontSize: 14,
    color: '#495057',
    lineHeight: 20,
  },
  refinedText: {
    fontSize: 15,
    color: '#212529',
    lineHeight: 22,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: '#dee2e6',
    marginVertical: 12,
  },
});
