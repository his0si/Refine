import React, { useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
  ActivityIndicator,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import AsyncStorage from '@react-native-async-storage/async-storage';
import KakaoLogin from '@react-native-seoul/kakao-login';
import { useAuth } from '../context/AuthContext';
import { loginWithKakao, loginWithGoogle } from '../services/api';

// WebBrowser 세션 완료 처리 (Google OAuth 필수)
WebBrowser.maybeCompleteAuthSession();

const OPENAI_API_KEY_STORAGE_KEY = '@openai_api_key';

export default function ProfileScreen() {
  const { user, logout, login } = useAuth();
  const [isLoading, setIsLoading] = React.useState(false);
  const [openaiApiKey, setOpenaiApiKey] = React.useState('');
  const [isEditingApiKey, setIsEditingApiKey] = React.useState(false);

  // Google OAuth 설정
  // TODO: 아래 클라이언트 ID들을 실제 발급받은 값으로 교체하세요
  const [googleRequest, googleResponse, googlePromptAsync] = Google.useIdTokenAuthRequest({
    clientId: 'YOUR_WEB_CLIENT_ID.apps.googleusercontent.com', // 웹 클라이언트 ID
    iosClientId: 'YOUR_IOS_CLIENT_ID.apps.googleusercontent.com', // iOS 클라이언트 ID
    androidClientId: 'YOUR_ANDROID_CLIENT_ID.apps.googleusercontent.com', // Android 클라이언트 ID
  });

  // Google OAuth 응답 처리
  useEffect(() => {
    if (googleResponse?.type === 'success') {
      const { id_token } = googleResponse.params;
      handleGoogleCallback(id_token);
    }
  }, [googleResponse]);

  // 컴포넌트 마운트 시 저장된 API 키 로드
  useEffect(() => {
    loadApiKey();
  }, []);

  /**
   * 저장된 OpenAI API 키 로드
   */
  const loadApiKey = async () => {
    try {
      const savedKey = await AsyncStorage.getItem(OPENAI_API_KEY_STORAGE_KEY);
      if (savedKey) {
        setOpenaiApiKey(savedKey);
      }
    } catch (error) {
      console.error('API 키 로드 실패:', error);
    }
  };

  /**
   * OpenAI API 키 저장
   */
  const saveApiKey = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      if (openaiApiKey.trim().length === 0) {
        // API 키를 삭제
        await AsyncStorage.removeItem(OPENAI_API_KEY_STORAGE_KEY);
        setOpenaiApiKey('');
        setIsEditingApiKey(false);
        Alert.alert(
          '설정 완료',
          'OpenAI API 키가 제거되었습니다.\n이제 무료 Ollama AI를 사용합니다.'
        );
      } else {
        // API 키 검증 (sk-로 시작하는지 확인)
        if (!openaiApiKey.startsWith('sk-')) {
          Alert.alert(
            '유효하지 않은 API 키',
            'OpenAI API 키는 "sk-"로 시작해야 합니다.\n키를 다시 확인해주세요.'
          );
          return;
        }

        await AsyncStorage.setItem(OPENAI_API_KEY_STORAGE_KEY, openaiApiKey.trim());
        setIsEditingApiKey(false);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert(
          '설정 완료',
          'OpenAI API 키가 저장되었습니다.\n이제 GPT-4o-mini를 사용합니다.'
        );
      }
    } catch (error) {
      console.error('API 키 저장 실패:', error);
      Alert.alert('오류', 'API 키 저장에 실패했습니다.');
    }
  };

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

  /**
   * 카카오 로그인 핸들러
   */
  const handleKakaoLogin = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setIsLoading(true);

      // 카카오 로그인 SDK 호출
      const result = await KakaoLogin.login();
      console.log('카카오 로그인 성공:', result);

      const { accessToken } = result;

      if (!accessToken) {
        throw new Error('액세스 토큰을 받지 못했습니다.');
      }

      // 백엔드로 토큰 전송하여 JWT 토큰 받기
      const response = await loginWithKakao(accessToken);

      if (response.success && response.data) {
        // AuthContext에 사용자 정보 저장
        await login(response.data.token, response.data.user);

        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert('로그인 성공', `${response.data.user.name}님, 환영합니다!`);
      } else {
        throw new Error(response.message || '로그인에 실패했습니다.');
      }
    } catch (error: any) {
      console.error('카카오 로그인 실패:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

      // 사용자가 취소한 경우 에러 메시지 표시 안 함
      if (error.code === 'E_KAKAO_LOGIN_CANCELLED') {
        return;
      }

      Alert.alert(
        '로그인 실패',
        error.message || '카카오 로그인에 실패했습니다.\n잠시 후 다시 시도해주세요.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 구글 로그인 핸들러
   */
  const handleGoogleLogin = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setIsLoading(true);

      // Google OAuth 프롬프트 표시
      const result = await googlePromptAsync();

      if (result?.type === 'cancel') {
        setIsLoading(false);
        return;
      }

      // 성공 시 useEffect에서 자동으로 handleGoogleCallback 호출됨
    } catch (error: any) {
      console.error('구글 로그인 실패:', error);
      setIsLoading(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        '로그인 실패',
        '구글 로그인에 실패했습니다.\n잠시 후 다시 시도해주세요.'
      );
    }
  };

  /**
   * 구글 OAuth 콜백 처리
   */
  const handleGoogleCallback = async (idToken: string) => {
    try {
      console.log('구글 ID 토큰 수신:', idToken.substring(0, 20) + '...');

      // 백엔드로 ID 토큰 전송하여 JWT 토큰 받기
      const response = await loginWithGoogle(idToken);

      if (response.success && response.data) {
        // AuthContext에 사용자 정보 저장
        await login(response.data.token, response.data.user);

        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert('로그인 성공', `${response.data.user.name}님, 환영합니다!`);
      } else {
        throw new Error(response.message || '로그인에 실패했습니다.');
      }
    } catch (error: any) {
      console.error('구글 콜백 처리 실패:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        '로그인 실패',
        error.message || '구글 로그인에 실패했습니다.\n잠시 후 다시 시도해주세요.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (user) {
    return (
      <ScrollView style={styles.container}>
        {/* 프로필 정보 */}
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

        {/* AI 모델 설정 섹션 */}
        <View style={styles.apiKeySection}>
          <Text style={styles.apiKeyTitle}>AI 모델 설정</Text>
          <Text style={styles.apiKeySubtitle}>
            기본: 무료 Ollama AI (서버 제공){'\n'}
            선택: OpenAI GPT-4o-mini (API 키 필요)
          </Text>

          {!isEditingApiKey ? (
            <View>
              <TouchableOpacity
                style={styles.editApiKeyButton}
                onPress={() => setIsEditingApiKey(true)}
              >
                <Text style={styles.editApiKeyButtonText}>
                  {openaiApiKey ? 'OpenAI API 키 변경' : 'OpenAI API 키 입력 (선택)'}
                </Text>
              </TouchableOpacity>
              {openaiApiKey && (
                <Text style={styles.apiKeyStatus}>
                  ✓ GPT-4o-mini 사용 중
                </Text>
              )}
            </View>
          ) : (
            <View>
              <TextInput
                style={styles.apiKeyInput}
                value={openaiApiKey}
                onChangeText={setOpenaiApiKey}
                placeholder="sk-proj-..."
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
              />
              <View style={styles.apiKeyButtons}>
                <TouchableOpacity
                  style={[styles.apiKeyButton, styles.cancelButton]}
                  onPress={() => {
                    loadApiKey();
                    setIsEditingApiKey(false);
                  }}
                >
                  <Text style={styles.cancelButtonText}>취소</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.apiKeyButton, styles.saveButton]}
                  onPress={saveApiKey}
                >
                  <Text style={styles.saveButtonText}>저장</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
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
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#000000" />
          ) : (
            <Text style={styles.kakaoButtonText}>카카오로 시작하기</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.loginButton, styles.googleButton]}
          onPress={handleGoogleLogin}
          disabled={isLoading || !googleRequest}
        >
          {isLoading ? (
            <ActivityIndicator color="#212529" />
          ) : (
            <Text style={styles.googleButtonText}>Google로 시작하기</Text>
          )}
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

      {/* AI 모델 설정 섹션 (비로그인 사용자용) */}
      <View style={styles.apiKeySection}>
        <Text style={styles.apiKeyTitle}>AI 모델 설정</Text>
        <Text style={styles.apiKeySubtitle}>
          기본: 무료 Ollama AI (서버 제공){'\n'}
          선택: OpenAI GPT-4o-mini (API 키 필요)
        </Text>

        {!isEditingApiKey ? (
          <View>
            <TouchableOpacity
              style={styles.editApiKeyButton}
              onPress={() => setIsEditingApiKey(true)}
            >
              <Text style={styles.editApiKeyButtonText}>
                {openaiApiKey ? 'OpenAI API 키 변경' : 'OpenAI API 키 입력 (선택)'}
              </Text>
            </TouchableOpacity>
            {openaiApiKey && (
              <Text style={styles.apiKeyStatus}>
                ✓ GPT-4o-mini 사용 중
              </Text>
            )}
          </View>
        ) : (
          <View>
            <TextInput
              style={styles.apiKeyInput}
              value={openaiApiKey}
              onChangeText={setOpenaiApiKey}
              placeholder="sk-proj-..."
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
            />
            <View style={styles.apiKeyButtons}>
              <TouchableOpacity
                style={[styles.apiKeyButton, styles.cancelButton]}
                onPress={() => {
                  loadApiKey();
                  setIsEditingApiKey(false);
                }}
              >
                <Text style={styles.cancelButtonText}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.apiKeyButton, styles.saveButton]}
                onPress={saveApiKey}
              >
                <Text style={styles.saveButtonText}>저장</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// API 키를 외부에서 가져올 수 있도록 export
export async function getStoredOpenAIKey(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(OPENAI_API_KEY_STORAGE_KEY);
  } catch (error) {
    console.error('API 키 로드 실패:', error);
    return null;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollContent: {
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
  // API 키 설정 스타일
  apiKeySection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  apiKeyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 8,
  },
  apiKeySubtitle: {
    fontSize: 13,
    color: '#6c757d',
    lineHeight: 20,
    marginBottom: 16,
  },
  editApiKeyButton: {
    backgroundColor: '#0d6efd',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  editApiKeyButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  apiKeyStatus: {
    marginTop: 12,
    fontSize: 13,
    color: '#198754',
    textAlign: 'center',
    fontWeight: '600',
  },
  apiKeyInput: {
    borderWidth: 1,
    borderColor: '#dee2e6',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    backgroundColor: '#fff',
    marginBottom: 12,
  },
  apiKeyButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  apiKeyButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#6c757d',
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#0d6efd',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
