import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useAuth } from '../context/AuthContext';

export default function ProfileScreen() {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    Alert.alert(
      '로그아웃',
      '로그아웃 하시겠습니까?',
      [
        {
          text: '취소',
          style: 'cancel',
        },
        {
          text: '로그아웃',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } catch (error) {
              Alert.alert('오류', '로그아웃에 실패했습니다.');
            }
          },
        },
      ]
    );
  };

  const handleKakaoLogin = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      '카카오 로그인',
      '카카오 로그인 기능은 네이티브 앱에서만 사용할 수 있습니다.\n\n' +
      '실제 앱을 빌드하려면:\n' +
      '1. https://developers.kakao.com/ 에서 앱 생성\n' +
      '2. 네이티브 앱 키 발급\n' +
      '3. app.json에 설정 추가\n' +
      '4. eas build로 앱 빌드'
    );
  };

  const handleGoogleLogin = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      '구글 로그인',
      '구글 로그인 기능은 네이티브 앱에서만 사용할 수 있습니다.\n\n' +
      '실제 앱을 빌드하려면:\n' +
      '1. https://console.cloud.google.com/ 에서 OAuth 클라이언트 ID 생성\n' +
      '2. app.json에 설정 추가\n' +
      '3. eas build로 앱 빌드'
    );
  };

  if (user) {
    return (
      <View style={styles.container}>
        <View style={styles.profileSection}>
          {user.avatarUrl ? (
            <Image source={{ uri: user.avatarUrl }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>
                {user.name?.charAt(0).toUpperCase() || 'U'}
              </Text>
            </View>
          )}

          <Text style={styles.name}>{user.name || '사용자'}</Text>
          {user.email && <Text style={styles.email}>{user.email}</Text>}

          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
          >
            <Text style={styles.logoutButtonText}>로그아웃</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>프로필 정보</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>사용자 ID</Text>
            <Text style={styles.infoValue}>#{user.id}</Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>로그인</Text>
        <Text style={styles.subtitle}>
          로그인하면 모든 기기에서{'\n'}히스토리를 동기화할 수 있습니다
        </Text>
      </View>

      <View style={styles.loginSection}>
        <TouchableOpacity
          style={[styles.loginButton, styles.kakaoButton]}
          onPress={handleKakaoLogin}
        >
          <Text style={styles.kakaoButtonText}>카카오로 시작하기</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.loginButton, styles.googleButton]}
          onPress={handleGoogleLogin}
        >
          <Text style={styles.googleButtonText}>Google로 시작하기</Text>
        </TouchableOpacity>

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>또는</Text>
          <View style={styles.dividerLine} />
        </View>

        <TouchableOpacity
          style={[styles.loginButton, styles.guestButton]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            Alert.alert(
              '알림',
              '현재 로그인 없이 사용 중입니다.\n' +
              '히스토리는 이 기기에만 저장됩니다.'
            );
          }}
        >
          <Text style={styles.guestButtonText}>로그인 없이 계속하기</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.noteSection}>
        <Text style={styles.noteText}>
          💡 로그인하지 않아도 모든 기능을 사용할 수 있습니다.{'\n'}
          단, 히스토리는 이 기기에만 저장됩니다.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 20,
  },
  header: {
    marginTop: 40,
    marginBottom: 40,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 14,
    color: '#6c757d',
    textAlign: 'center',
    lineHeight: 20,
  },
  loginSection: {
    marginBottom: 30,
  },
  loginButton: {
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  kakaoButton: {
    backgroundColor: '#FEE500',
  },
  kakaoButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  googleButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  googleButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
  },
  guestButton: {
    backgroundColor: '#e9ecef',
  },
  guestButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#495057',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#dee2e6',
  },
  dividerText: {
    marginHorizontal: 12,
    fontSize: 13,
    color: '#6c757d',
  },
  noteSection: {
    backgroundColor: '#fff3cd',
    borderRadius: 8,
    padding: 16,
  },
  noteText: {
    fontSize: 13,
    color: '#856404',
    lineHeight: 20,
  },
  profileSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 30,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 16,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#0d6efd',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  name: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 20,
  },
  logoutButton: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 6,
    backgroundColor: '#f8d7da',
  },
  logoutButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#842029',
  },
  infoSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3f5',
  },
  infoLabel: {
    fontSize: 14,
    color: '#6c757d',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#212529',
  },
});
