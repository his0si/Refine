# Refine

**공적인 상황에서의 글쓰기를 도와주는 AI 기반 모바일 애플리케이션**

사용자가 작성한 문장 초안을 입력하면, 상황과 목적에 맞는 더 정중하고 전문적인 표현으로 다듬어 줍니다.

---

## 📝 프로젝트 소개

Refine는 교수님께 보내는 메일부터 중요한 비즈니스 제안서까지, 모든 공적 커뮤니케이션의 완성도를 높여줍니다.

### 타겟 사용자

- **대학생 및 사회초년생**: 교수님이나 선배에게 메일, 메시지를 보내기 전 문장을 고쳐 쓰는 사용자
- **직장인**: 거래처, 고객 등 외부 소통이 잦아 정중하고 전문적인 커뮤니케이션이 필요한 사용자

### 핵심 가치

"감사합니다" 한 마디를 하더라도, 더 진심이 담기고 격식 있는 표현으로 다듬어 사용자의 선택을 돕습니다.

---

## 🛠 기술 스택

### 프론트엔드
- **React Native** - 크로스 플랫폼 모바일 앱
- **Expo** - 개발 및 빌드 환경
- **TypeScript** - 타입 안정성
- **React Navigation** - Bottom Tabs 네비게이션
- **expo-haptics** - 햅틱 피드백으로 향상된 UX
- **AsyncStorage** - 로컬 데이터 저장

### 백엔드
- **Node.js** - 런타임 환경
- **Express** - RESTful API 서버
- **TypeScript** - 타입 안정성
- **PostgreSQL** - 관계형 데이터베이스
- **Ollama (llama3.2:3b)** - 무료 AI 텍스트 리파인먼트 (기본)
- **OpenAI API (GPT-4o-mini)** - 프리미엄 AI (선택사항, 사용자 API 키 필요)
- **JWT** - 인증 토큰 관리
- **Passport.js** - OAuth 인증

### 인프라
- **Docker & Docker Compose** - 컨테이너화 및 오케스트레이션
- **Ollama Container** - 로컬 AI 모델 서버
- **영구 볼륨** - 데이터 지속성 보장 (도커 재시작/삭제 시에도 데이터 유지)

---

## ⭐ 구현된 모든 기능

### 1. AI 텍스트 다듬기 (Core Feature)

**위치**: `frontend/src/screens/RefineScreen.tsx` + `backend/src/services/aiService.ts`

#### 기능 상세:
- 사용자가 입력한 원본 문장을 AI를 통해 공적인 상황에 맞게 다듬기
- 3가지 다른 뉘앙스의 표현 제공 (각각 존댓말 수준, 격식 정도가 다름)
- 상황/컨텍스트 입력 가능 (예: "교수님께 메일", "거래처에 제안")
- 각 옵션을 탭하여 선택 가능 (햅틱 피드백 포함)

#### 사용 흐름:
1. 상황 입력 (선택사항): "교수님께 메일"
2. 원본 문장 입력: "감사합니다"
3. "다듬기" 버튼 클릭
4. AI가 3가지 옵션 제공:
   - "진심으로 감사드립니다"
   - "깊이 감사의 말씀을 드립니다"
   - "항상 감사하게 생각하고 있습니다"
5. 원하는 옵션 선택

#### AI 모델 선택:
**기본: Ollama (무료)** ✨
- 서버에서 실행되는 로컬 AI 모델
- 모델: llama3.2:3b (한국어 지원)
- 설정 불필요, 바로 사용 가능
- 무제한 무료 사용

**선택: OpenAI (프리미엄)**
- GPT-4o-mini 모델 사용 (더 높은 품질)
- 사용자가 앱의 **프로필 화면 > AI 모델 설정**에서 본인의 API 키 입력
- API 키 입력 시 자동으로 OpenAI 사용
- 키 제거 시 자동으로 Ollama로 복귀

#### 기술 구현:
- **듀얼 AI 시스템**: Ollama (기본) + OpenAI (선택)
- 시스템 프롬프트: 한국어 공적 글쓰기 전문가 역할
- Temperature: 0.7 (적절한 창의성과 일관성)
- Max Tokens: 500
- 응답에 provider 필드 포함 ('ollama' 또는 'openai')

---

### 2. 소셜 로그인 (카카오/구글)

**위치**: `frontend/src/screens/ProfileScreen.tsx` + `backend/src/routes/authRoutes.ts`

#### 지원 로그인:
1. **카카오 로그인**
   - 카카오 OAuth 2.0 사용
   - 카카오 사용자 정보 (이메일, 닉네임, 프로필 이미지) 자동 수집
   - Backend: `POST /api/auth/kakao`

2. **구글 로그인**
   - Google OAuth 2.0 사용
   - Google ID Token 검증
   - Backend: `POST /api/auth/google`

3. **로그인 없이 사용**
   - 로그인 필수 아님
   - 비로그인 사용자도 모든 기능 이용 가능
   - 히스토리는 로컬 기기에만 저장

#### 인증 흐름:
1. 사용자가 카카오/구글 로그인 선택
2. OAuth 인증 완료 후 Access Token/ID Token 획득
3. Backend로 토큰 전송
4. Backend에서 토큰 검증 및 사용자 정보 조회
5. 사용자 생성 또는 업데이트 (findOrCreateUser)
6. JWT 토큰 생성 (유효기간: 30일)
7. Frontend에 토큰 반환
8. AsyncStorage에 토큰 저장
9. 이후 모든 API 요청에 토큰 자동 포함 (Axios Interceptor)

#### 데이터베이스 구조:
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE,
  name VARCHAR(255),
  provider VARCHAR(50) NOT NULL,  -- 'kakao' or 'google'
  provider_id VARCHAR(255) NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(provider, provider_id)
);
```

---

### 3. 히스토리 관리

**위치**: `frontend/src/screens/HistoryScreen.tsx` + `backend/src/models/Refinement.ts`

#### 기능:
- 과거에 다듬은 모든 문장 저장 및 조회
- 최신순으로 정렬 (최대 50개)
- Pull-to-Refresh 기능
- 각 항목 삭제 기능
- 상대 시간 표시 ("방금 전", "5분 전", "3시간 전" 등)

#### 로그인 vs 비로그인:
- **로그인 사용자**: 서버에 저장, 모든 기기에서 동기화
- **비로그인 사용자**: 로컬 기기에만 저장

#### 히스토리 항목 정보:
- 원본 문장
- 다듬어진 문장
- 상황/컨텍스트
- 생성 시간

#### 데이터베이스 구조:
```sql
CREATE TABLE refinements (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  original_text TEXT NOT NULL,
  refined_text TEXT NOT NULL,
  context VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

### 4. 사용자 프로필 관리

**위치**: `frontend/src/screens/ProfileScreen.tsx`

#### 로그인 상태:
- 사용자 프로필 사진 표시
- 이름, 이메일 표시
- 사용자 ID 표시
- 로그아웃 버튼

#### 비로그인 상태:
- 카카오 로그인 버튼
- 구글 로그인 버튼
- "로그인 없이 계속하기" 버튼
- 로그인 없이 사용 시 안내 메시지

#### AI 모델 설정 (모든 사용자):
- **OpenAI API 키 입력 기능** (로그인 여부와 무관)
- 키 입력 시 OpenAI GPT-4o-mini 사용
- 키 미입력 시 무료 Ollama 사용
- API 키 검증 (sk- 접두사 확인)
- AsyncStorage에 안전하게 저장
- 언제든지 키 변경/제거 가능

---

### 5. OpenAI API 키 관리 (클라이언트 측)

**위치**: `frontend/src/screens/ProfileScreen.tsx`

#### 핵심 특징:
- **서버에 API 키 저장 안 함** - 사용자 기기에만 저장
- **보안**: AsyncStorage를 사용한 로컬 저장
- **유연성**: 언제든지 키 입력/변경/제거 가능
- **투명성**: 어떤 AI가 사용되는지 사용자가 선택

#### 사용 방법:
1. 프로필 화면 > "AI 모델 설정" 섹션
2. "OpenAI API 키 입력 (선택)" 버튼 클릭
3. [OpenAI Platform](https://platform.openai.com/api-keys)에서 발급받은 API 키 입력
4. "저장" 버튼 클릭
5. 이후 모든 텍스트 다듬기 요청에 GPT-4o-mini 사용

#### 키 제거:
1. "OpenAI API 키 변경" 버튼 클릭
2. 입력 필드를 비우고 "저장" 클릭
3. 이후 무료 Ollama AI로 자동 전환

---

### 6. JWT 기반 인증 시스템

**위치**: `backend/src/middleware/auth.ts` + `backend/src/utils/jwt.ts`

#### 인증 전략:
1. **Optional Auth**: 토큰이 있으면 검증, 없어도 통과
   - 다듬기, 히스토리 조회 API에 적용
   - 로그인/비로그인 모두 사용 가능

2. **Required Auth**: 토큰 필수
   - 사용자 정보 조회 API에 적용

#### JWT 토큰 구조:
```typescript
{
  userId: number,
  email?: string,
  name?: string,
  iat: number,  // 발급 시간
  exp: number   // 만료 시간 (30일 후)
}
```

#### API 요청 흐름:
1. Frontend: AsyncStorage에서 토큰 읽기
2. Axios Interceptor가 자동으로 `Authorization: Bearer <token>` 헤더 추가
3. Backend: 미들웨어에서 토큰 검증
4. 유효한 토큰이면 `req.userId` 설정
5. 컨트롤러에서 `req.userId` 사용하여 사용자별 데이터 처리

---

### 7. Docker 영구 볼륨 (Persistent Volume)

**위치**: `docker-compose.yml`

#### 핵심 특징:
- PostgreSQL 데이터와 Ollama 모델을 영구 볼륨에 저장
- 도커 컨테이너를 중지, 재시작, 삭제해도 데이터 유지
- `docker system prune -a`로 모든 캐시를 삭제해도 데이터 유지

#### 볼륨 구성:
```yaml
volumes:
  postgres_data:
    driver: local
  ollama_data:
    driver: local
```

#### 데이터 보호 시나리오:
✅ `docker-compose down` → 데이터 유지
✅ `docker-compose restart` → 데이터 유지
✅ `docker system prune -a` → 데이터 유지
✅ Docker Desktop 재시작 → 데이터 유지
❌ `docker-compose down -v` → 데이터 삭제 (볼륨 명시적 삭제)
❌ `docker volume rm refine_postgres_data refine_ollama_data` → 데이터 삭제

---

### 8. RESTful API 엔드포인트

#### 인증 API (`/api/auth`)
| Method | Endpoint | 설명 | 인증 |
|--------|----------|------|------|
| POST | `/api/auth/kakao` | 카카오 로그인 | ❌ |
| POST | `/api/auth/google` | 구글 로그인 | ❌ |
| GET | `/api/auth/me` | 현재 사용자 정보 | ✅ |

#### 텍스트 다듬기 API (`/api`)
| Method | Endpoint | 설명 | 인증 |
|--------|----------|------|------|
| POST | `/api/refine` | 텍스트 다듬기 | 선택 |
| GET | `/api/history` | 히스토리 조회 | 선택 |
| GET | `/api/history/:id` | 특정 항목 조회 | 선택 |
| DELETE | `/api/history/:id` | 항목 삭제 | 선택 |

#### 헬스 체크
| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/health` | 서버 상태 확인 |

---

### 9. UX/UI 특징

#### 햅틱 피드백 (expo-haptics)
- 버튼 클릭 시 진동 피드백
- 성공/실패 알림에 다른 피드백
- 옵션 선택 시 미세한 진동

#### 애니메이션 (LayoutAnimation)
- 부드러운 화면 전환
- 결과 표시 시 자연스러운 등장
- 삭제/추가 시 애니메이션

#### 디자인
- 깔끔한 카드 기반 레이아웃
- 색상: Bootstrap 색상 팔레트 사용
- 그림자와 라운딩으로 모던한 느낌

---

## 🚀 설치 및 실행

### 사전 요구사항

- **Docker & Docker Compose** 설치 ([Docker Desktop](https://www.docker.com/products/docker-desktop) 권장)
- **Node.js 18+** ([다운로드](https://nodejs.org/))
- **Expo CLI** (자동 설치됨)
- **모바일 기기 또는 에뮬레이터**
  - iOS: Xcode Simulator 또는 iPhone (Expo Go 앱 설치)
  - Android: Android Studio Emulator 또는 Android 기기 (Expo Go 앱 설치)

**선택사항:**
- **OpenAI API Key** ([발급 링크](https://platform.openai.com/api-keys)) - 더 높은 품질의 AI를 원할 경우
  - ⚠️ OpenAI API 키는 **서버에 설정하지 않습니다**
  - 앱의 **프로필 화면 > AI 모델 설정**에서 사용자가 직접 입력
  - 키 없이도 무료 Ollama AI로 모든 기능 사용 가능

### 1단계: 환경 변수 설정 (.env 파일)

루트 디렉토리의 `.env` 파일은 **대부분 기본값으로 사용 가능**합니다:

```env
# ========================================
# AI 모델 설정
# ========================================
# 기본: Ollama (무료, 서버에서 실행) - 설정 불필요!
# 선택: OpenAI (사용자가 앱에서 API 키 입력)
#
# ⚠️ 중요: OpenAI API 키는 서버(.env)에 입력하지 않습니다!
#          사용자가 앱의 "프로필 화면 > AI 모델 설정"에서 직접 입력합니다.

# Ollama 서버 URL (Docker Compose가 자동 설정 - 수정 불필요)
OLLAMA_URL=http://ollama:11434

# ========================================
# JWT Secret (필수 - 보안을 위해 강력한 랜덤 문자열로 변경)
# ========================================
JWT_SECRET=0820  # ⚠️ 운영 환경에서는 반드시 변경하세요!
# 랜덤 문자열 생성: openssl rand -base64 32

# ========================================
# 데이터베이스 설정 (Docker Compose가 자동 사용 - 수정 불필요)
# ========================================
POSTGRES_USER=refine_user
POSTGRES_PASSWORD=refine_password
POSTGRES_DB=refine_db

# ========================================
# 백엔드 서버 설정 (기본값 사용 - 수정 불필요)
# ========================================
PORT=3000
NODE_ENV=development

# ========================================
# OAuth 로그인 설정 (선택사항 - 필요 시에만 설정)
# ========================================
# 카카오 개발자 센터: https://developers.kakao.com/
KAKAO_CLIENT_ID=your_kakao_client_id
KAKAO_CLIENT_SECRET=

# 구글 클라우드 콘솔: https://console.cloud.google.com/
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

**중요 체크리스트:**
- [ ] `JWT_SECRET`을 강력한 랜덤 문자열로 변경 (최소 32자 권장) - **필수**
- [ ] 운영 환경에서는 `.env` 파일을 절대 Git에 커밋하지 않기 (`.gitignore`에 포함됨)
- [ ] OAuth 로그인을 사용하려면 위의 "📱 OAuth 로그인 상세 설정" 섹션 참고 (선택사항)

**💡 빠르게 시작하려면:** JWT_SECRET만 변경하면 바로 실행 가능합니다!

### 2단계: Docker로 백엔드 실행

```bash
# PostgreSQL, Ollama, 백엔드 서버를 모두 실행
docker-compose up -d

# 로그 확인 (서버가 정상적으로 시작되는지 확인)
docker-compose logs -f backend
```

**⏱️ 첫 실행 시:** Ollama 컨테이너가 llama3.2:3b 모델을 다운로드하므로 **5-10분** 정도 소요될 수 있습니다.
- 모델은 영구 볼륨에 저장되므로 다음부터는 즉시 시작됩니다.
- 다운로드 진행 상황 확인: `docker-compose logs -f ollama`

**성공적으로 실행되면 다음과 같은 로그가 표시됩니다:**
```
✅ Database connected
Running database migrations...
Migration completed successfully!
🚀 Server running on port 3000
📝 Health check: http://localhost:3000/health
🔧 API endpoint: http://localhost:3000/api
🔐 Auth endpoint: http://localhost:3000/api/auth
```

**백엔드 동작 확인:**
```bash
# 헬스 체크 (정상이면 {"status":"ok"} 응답)
curl http://localhost:3000/health

# Docker 컨테이너 상태 확인 (3개 모두 실행 중이어야 함)
docker-compose ps
# refine-postgres, refine-ollama, refine-backend 모두 "Up" 상태
```

**문제 해결:**
- 포트 3000, 5432, 11434가 이미 사용 중이면 다른 프로그램을 종료하거나 `.env`에서 포트 변경
- `docker-compose up -d --build`로 강제 재빌드
- Ollama 모델 다운로드가 너무 오래 걸리면: `docker-compose logs -f ollama`로 진행 상황 확인

### 3단계: 프론트엔드 실행

```bash
cd frontend
npm install
npm start
```

**Expo 개발 서버가 시작되고 다음과 같이 표시됩니다:**
```
› Metro waiting on exp://192.168.x.x:8081
› Scan the QR code above with Expo Go (Android) or the Camera app (iOS)

› Press a │ open Android
› Press i │ open iOS simulator
› Press w │ open web

› Press r │ reload app
› Press m │ toggle menu
```

### 4단계: 모바일에서 실행

#### 방법 1: 실제 기기에서 실행 (권장)

1. **Expo Go 앱 설치**
   - **iOS**: App Store에서 "Expo Go" 검색 후 설치
   - **Android**: Play Store에서 "Expo Go" 검색 후 설치

2. **QR 코드 스캔**
   - **iOS**: iPhone 기본 카메라 앱으로 QR 코드 스캔
   - **Android**: Expo Go 앱에서 "Scan QR Code" 버튼 클릭

3. **네트워크 확인**
   - ⚠️ **중요**: 모바일 기기와 개발 컴퓨터가 **같은 Wi-Fi 네트워크**에 연결되어 있어야 합니다
   - 회사/학교 네트워크에서는 방화벽으로 인해 연결이 안 될 수 있습니다

4. **API URL 설정 (중요!)**

   모바일 기기에서 테스트할 때는 `localhost` 대신 컴퓨터의 실제 IP 주소를 사용해야 합니다.

   **Windows에서 IP 확인:**
   ```bash
   ipconfig
   # "무선 LAN 어댑터 Wi-Fi" 섹션의 IPv4 주소 확인 (예: 192.168.0.100)
   ```

   **Mac/Linux에서 IP 확인:**
   ```bash
   ifconfig | grep "inet "
   # 또는
   ipconfig getifaddr en0
   ```

   **`frontend/src/services/api.ts` 파일 수정:**
   ```typescript
   // 변경 전
   const API_BASE_URL = 'http://localhost:3000/api';

   // 변경 후 (실제 IP로 교체)
   const API_BASE_URL = 'http://192.168.0.100:3000/api';
   ```

   수정 후 Expo 앱에서 자동으로 새로고침됩니다.

#### 방법 2: 에뮬레이터에서 실행

**iOS Simulator (Mac만 가능):**
```bash
cd frontend
npm run ios
```
- Xcode가 설치되어 있어야 합니다
- `localhost`로 그대로 사용 가능

**Android Emulator:**
```bash
cd frontend
npm run android
```
- Android Studio가 설치되어 있어야 합니다
- 에뮬레이터가 실행 중이어야 합니다
- `localhost` 대신 `10.0.2.2` 사용 (Android 에뮬레이터 특수 IP)
  ```typescript
  const API_BASE_URL = 'http://10.0.2.2:3000/api';
  ```

#### 방법 3: 웹 브라우저에서 실행 (제한적)

```bash
cd frontend
npm run web
```
- React Native 일부 기능이 웹에서 작동하지 않을 수 있습니다
- 빠른 테스트용으로만 사용

---

## 🧪 API 테스트

### 헬스 체크
```bash
curl http://localhost:3000/health
```

### 텍스트 다듬기
```bash
curl -X POST http://localhost:3000/api/refine \
  -H "Content-Type: application/json" \
  -d '{
    "text": "감사합니다",
    "context": "교수님께 메일"
  }'
```

### 히스토리 조회
```bash
curl http://localhost:3000/api/history?limit=10
```

---

## 💾 데이터 지속성

### 영구 볼륨 관리

프로젝트에는 2개의 영구 볼륨이 있습니다:
- `postgres_data`: PostgreSQL 데이터베이스 데이터
- `ollama_data`: Ollama AI 모델 (llama3.2:3b, 약 2GB)

#### 안전한 작업 (데이터 유지)
```bash
# 도커 종료 후 재시작
docker-compose down
docker-compose up -d

# 모든 캐시 삭제 후 재시작
docker system prune -a
docker-compose up -d
```

#### 위험한 작업 (데이터 삭제)
```bash
# 볼륨 포함 모두 삭제 (데이터베이스와 Ollama 모델 삭제)
docker-compose down -v

# 특정 볼륨 삭제
docker volume rm refine_postgres_data   # PostgreSQL 데이터만 삭제
docker volume rm refine_ollama_data     # Ollama 모델만 삭제 (재다운로드 필요)
```

### 볼륨 확인
```bash
# 볼륨 목록
docker volume ls

# 볼륨 상세 정보
docker volume inspect refine_postgres_data
docker volume inspect refine_ollama_data

# 볼륨 디스크 사용량 확인
docker system df -v
```

---

## 🗄️ 데이터베이스 관리 (DBeaver 연결)

### PostgreSQL 자동 설정

`docker-compose up -d` 실행 시 **모든 것이 자동으로 설정**됩니다:
- ✅ PostgreSQL 15 설치 및 실행
- ✅ 데이터베이스 `refine_db` 생성
- ✅ 사용자 `refine_user` 생성
- ✅ 테이블 생성 (users, refinements)
- ✅ 인덱스 생성 (성능 최적화)
- ✅ 영구 볼륨 설정 (데이터 보존)

백엔드의 `src/database/migrate.ts`가 서버 시작 시 자동 실행됩니다.

### DBeaver로 데이터베이스 내용 확인하기

**1. DBeaver 설치**
- [DBeaver 다운로드](https://dbeaver.io/download/) (Community Edition 무료)
- Windows/Mac/Linux 모두 지원

**2. PostgreSQL 연결 설정**

DBeaver 실행 후:
1. 좌측 상단 "새 데이터베이스 연결" 버튼 클릭 (또는 Database > New Database Connection)
2. PostgreSQL 선택 > Next

**3. 연결 정보 입력**
```
Host: localhost
Port: 5432
Database: refine_db
Username: refine_user
Password: refine_password
```

**상세 설정:**
- **Main 탭**:
  - Host: `localhost`
  - Port: `5432`
  - Database: `refine_db`
  - Username: `refine_user`
  - Password: `refine_password`
  - ✅ "Save password" 체크

- **PostgreSQL 탭**:
  - Show all databases: 체크하지 않음 (선택사항)

**4. Test Connection 클릭**
- 성공하면 "Connected" 메시지 표시
- 실패하면:
  - Docker 컨테이너가 실행 중인지 확인: `docker-compose ps`
  - 포트 5432가 열려있는지 확인

**5. Finish 클릭하여 연결 완료**

### 데이터베이스 탐색

연결 후 왼쪽 패널에서:
```
localhost:5432 (PostgreSQL)
└── Databases
    └── refine_db
        └── Schemas
            └── public
                └── Tables
                    ├── users          # 사용자 정보
                    └── refinements    # 텍스트 히스토리
```

**users 테이블 조회:**
```sql
SELECT * FROM users ORDER BY created_at DESC;
```

**refinements 테이블 조회:**
```sql
SELECT
  id,
  user_id,
  original_text,
  refined_text,
  context,
  created_at
FROM refinements
ORDER BY created_at DESC
LIMIT 10;
```

**사용자별 히스토리 개수:**
```sql
SELECT
  u.name,
  u.email,
  COUNT(r.id) as refinement_count
FROM users u
LEFT JOIN refinements r ON u.id = r.user_id
GROUP BY u.id, u.name, u.email
ORDER BY refinement_count DESC;
```

### 빠른 SQL 실행

DBeaver에서 SQL 스크립트 실행하기:
1. 테이블 우클릭 > "SQL Editor" > "New SQL Script"
2. SQL 쿼리 작성
3. **Ctrl + Enter** (또는 상단 실행 버튼) 클릭

### 데이터 백업/복원

**백업 (Export):**
1. 테이블 우클릭 > "Export Data"
2. 형식 선택 (CSV, SQL, Excel 등)

**복원 (Import):**
1. 테이블 우클릭 > "Import Data"
2. 파일 선택 및 매핑 설정

---

## ✅ 빠른 시작 가이드 (Quick Start)

### 3분만에 시작하기 ⚡

```bash
# 1. .env 파일에서 JWT_SECRET만 변경 (OpenAI API 키 불필요!)
JWT_SECRET=YOUR_STRONG_RANDOM_STRING

# 2. Docker로 백엔드 실행 (PostgreSQL + Ollama + Backend)
docker-compose up -d
# ⏱️ 첫 실행 시 Ollama 모델 다운로드로 5-10분 소요

# 3. Frontend 실행
cd frontend
npm install
npm start

# 4. Expo Go 앱으로 QR 코드 스캔
```

**✨ 무료 Ollama AI로 바로 사용 가능!**
- OpenAI API 키 없이도 모든 기능 사용 가능
- 더 높은 품질의 AI를 원하면 앱에서 OpenAI API 키 입력 (선택사항)
- OAuth 로그인도 선택사항 - 로그인 없이도 모든 기능 이용 가능

---

## ✅ 앱 실행 전 필수 설정 체크리스트

아래 단계들을 **순서대로** 완료해야 앱이 정상적으로 작동합니다.

### 1. JWT Secret 설정 (필수) ⭐
- [ ] `.env` 파일의 `JWT_SECRET`을 강력한 랜덤 문자열로 변경
- [ ] 운영 환경에서는 절대 기본값 (`0820`) 사용 금지
```bash
# 예시: 랜덤 문자열 생성 (Linux/Mac)
openssl rand -base64 32
# Windows에서는 온라인 생성기 사용: https://randomkeygen.com/
```

### 2. Docker 실행 (자동 설정) ✅
- [ ] Docker와 Docker Compose 설치 확인
- [ ] `docker-compose up -d` 실행 시 **자동으로 모든 것이 설정됨**
  - PostgreSQL 데이터베이스 생성 및 테이블 생성
  - Ollama AI 컨테이너 실행 및 모델 다운로드
  - Backend 서버 실행
- [ ] ⏱️ 첫 실행 시 Ollama 모델 다운로드로 5-10분 소요 (다음부터는 즉시 시작)

### 3. Frontend API URL 설정 (필수)
- [ ] **모바일 기기에서 테스트 시**: `frontend/src/services/api.ts:8`의 `API_BASE_URL`을 컴퓨터의 로컬 IP로 변경
```typescript
// Windows: ipconfig 명령어로 IP 확인
// Mac/Linux: ifconfig 명령어로 IP 확인
const API_BASE_URL = 'http://192.168.x.x:3000/api';  // localhost 대신 실제 IP 사용
```
- [ ] **웹 브라우저/iOS Simulator 테스트 시**: `http://localhost:3000/api` 그대로 사용
- [ ] **Android Emulator 사용 시**: `http://10.0.2.2:3000/api` 사용

### 4. OpenAI API Key 설정 (선택사항)
- [ ] **기본 AI는 무료 Ollama** - OpenAI 키 없이도 모든 기능 사용 가능!
- [ ] **더 높은 품질을 원하는 경우**:
  - [OpenAI Platform](https://platform.openai.com/api-keys)에서 API Key 발급
  - 앱의 **프로필 화면 > AI 모델 설정**에서 키 입력 (서버가 아닌 앱에서 입력!)
  - 자동으로 GPT-4o-mini 사용
- [ ] ⚠️ **중요**: OpenAI API 키는 `.env` 파일에 입력하지 않습니다!

### 5. OAuth 로그인 설정 (선택사항)
- [ ] **카카오 로그인** 사용 시: 아래 "카카오 로그인 설정" 섹션 참고
- [ ] **구글 로그인** 사용 시: 아래 "구글 로그인 설정" 섹션 참고
- [ ] ⚠️ **로그인 없이도 모든 기능 사용 가능** (히스토리는 로컬 저장)

---

## 📱 OAuth 로그인 상세 설정 (선택사항)

### 중요: Expo 앱의 Redirect URI 이해하기

React Native Expo 앱에서 OAuth를 사용할 때는 **Custom URL Scheme** 또는 **Expo AuthSession**을 사용합니다.

#### 프로젝트의 Bundle Identifier (app.json 확인)
현재 설정:
- **iOS**: `com.refine.app` (frontend/app.json:19)
- **Android**: `com.refine.app` (frontend/app.json:26)
- **Expo Slug**: `refine` (frontend/app.json:4)

---

### 카카오 로그인 설정

#### 1. 카카오 개발자 콘솔에서 API 키 발급

**1단계: 앱 생성**
1. [Kakao Developers](https://developers.kakao.com/) 접속 및 로그인
2. 우측 상단 "내 애플리케이션" 클릭
3. "애플리케이션 추가하기" 버튼 클릭
4. 앱 이름: "Refine" (원하는 이름), 회사명 입력
5. "저장" 클릭

**2단계: API 키 확인 및 복사** ⭐ **중요**

앱 생성 후 "앱 설정" > "앱 키" 메뉴에서 다음 2개의 키를 확인:

| 키 이름 | 어디에 사용? | 복사할 곳 |
|---------|-------------|----------|
| **REST API 키** | 백엔드 서버 | `.env` 파일의 `KAKAO_CLIENT_ID` |
| **네이티브 앱 키** | 모바일 앱 | `frontend/app.json`의 `nativeAppKey` |

**예시:**
```
REST API 키: 1234567890abcdef1234567890abcdef
네이티브 앱 키: a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
```

**3단계: 플랫폼 설정**
1. "앱 설정" > "플랫폼" 메뉴
2. **Android 플랫폼 등록**
   - 패키지명: `com.refine.app`
   - 마켓 URL: (선택사항)
   - "저장" 클릭
3. **iOS 플랫폼 등록**
   - Bundle ID: `com.refine.app`
   - 앱스토어 ID: (선택사항)
   - "저장" 클릭

**4단계: 카카오 로그인 활성화 및 Redirect URI 등록** ⭐ **매우 중요**

1. "제품 설정" > "카카오 로그인" 메뉴
2. 우측 상단 "활성화 설정" ON으로 변경
3. 아래로 스크롤하여 **"Redirect URI"** 섹션 찾기
4. "Redirect URI 등록" 버튼 클릭
5. 다음 URI들을 **하나씩** 추가:
   ```
   refine://oauth
   com.refine.app://oauth
   exp://localhost:19000
   https://auth.expo.io/@YOUR_EXPO_USERNAME/refine
   ```

   ⚠️ **주의**: `YOUR_EXPO_USERNAME`은 실제 Expo 계정 username으로 교체
   - Expo 계정이 없으면: https://expo.dev/signup 에서 생성
   - Username 확인: Expo 계정 프로필 페이지에서 확인

**각 Redirect URI 설명:**
- `refine://oauth` - Expo Slug 기반 딥링크 (개발/프로덕션)
- `com.refine.app://oauth` - Bundle ID 기반 딥링크 (프로덕션)
- `exp://localhost:19000` - Expo Go 앱 테스트용 (개발)
- `https://auth.expo.io/@...` - EAS Build 프로덕션 환경

**5단계: 동의 항목 설정**
1. "제품 설정" > "카카오 로그인" > "동의 항목" 탭
2. 다음 항목들을 설정:
   - **닉네임**: 필수 동의 (ON)
   - **프로필 이미지**: 선택 동의 (선택사항)
   - **카카오계정(이메일)**: 선택 동의 (ON 권장)
3. "저장" 클릭

#### 2. 백엔드 환경 변수 설정

`.env` 파일에 REST API 키 입력:
```env
# REST API 키를 복사하여 입력
KAKAO_CLIENT_ID=1234567890abcdef1234567890abcdef

# 카카오는 Client Secret 불필요 (비워두기)
KAKAO_CLIENT_SECRET=
```

#### 3. Frontend 설정

**app.json 설정:**
```json
{
  "expo": {
    "scheme": "refine",
    "plugins": [
      [
        "@react-native-seoul/kakao-login",
        {
          "nativeAppKey": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6"
        }
      ]
    ]
  }
}
```

⚠️ `nativeAppKey`에 **네이티브 앱 키**를 입력하세요 (REST API 키 아님!)

**ProfileScreen.tsx 설정:**
```typescript
// frontend/src/screens/ProfileScreen.tsx:27-30
const [googleRequest, googleResponse, googlePromptAsync] = Google.useIdTokenAuthRequest({
  clientId: 'YOUR_WEB_CLIENT_ID.apps.googleusercontent.com',
  iosClientId: 'YOUR_IOS_CLIENT_ID.apps.googleusercontent.com',
  androidClientId: 'YOUR_ANDROID_CLIENT_ID.apps.googleusercontent.com',
});
```

카카오는 이미 구현되어 있으므로 **Google 클라이언트 ID만 입력**하면 됩니다.

---

### 구글 로그인 설정

#### 1. Google Cloud Console에서 API 키 발급

**1단계: 프로젝트 생성**
1. [Google Cloud Console](https://console.cloud.google.com/) 접속 및 로그인
2. 좌측 상단 프로젝트 선택 드롭다운 클릭
3. 우측 상단 "새 프로젝트" 버튼 클릭
4. 프로젝트 이름: "Refine" 입력
5. "만들기" 클릭
6. 프로젝트가 생성되면 해당 프로젝트 선택

**2단계: OAuth 동의 화면 구성**
1. 좌측 메뉴 "API 및 서비스" > "OAuth 동의 화면" 클릭
2. User Type: **"외부"** 선택 > "만들기" 클릭
3. **앱 정보 입력:**
   - 앱 이름: `Refine`
   - 사용자 지원 이메일: 본인 이메일
   - 앱 로고: (선택사항)
   - 개발자 연락처 정보: 본인 이메일
4. "저장 후 계속" 클릭
5. **범위 (Scopes) 추가:**
   - "범위 추가 또는 삭제" 버튼 클릭
   - 다음 항목 선택:
     - `../auth/userinfo.email` ✓
     - `../auth/userinfo.profile` ✓
     - `openid` ✓
   - "업데이트" 클릭
   - "저장 후 계속" 클릭
6. **테스트 사용자 추가:** (선택사항)
   - 본인 이메일 추가
   - "저장 후 계속" 클릭
7. "대시보드로 돌아가기" 클릭

**3단계: OAuth 2.0 클라이언트 ID 생성** ⭐ **매우 중요**

총 **3개의 클라이언트 ID**를 생성해야 합니다:

**A. 웹 클라이언트 ID (백엔드 서버용)**

1. "API 및 서비스" > "사용자 인증 정보" 메뉴
2. 상단 "+ 사용자 인증 정보 만들기" > "OAuth 클라이언트 ID" 클릭
3. 애플리케이션 유형: **"웹 애플리케이션"** 선택
4. 이름: `Refine Web Client`
5. 승인된 리디렉션 URI: (비워두기 - 백엔드에서 직접 토큰 검증)
6. "만들기" 클릭
7. **클라이언트 ID**와 **클라이언트 보안 비밀** 복사

**복사한 값을 `.env` 파일에 입력:**
```env
GOOGLE_CLIENT_ID=123456789012-abcdefghijklmnopqrstuvwxyz123456.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-AbCdEfGhIjKlMnOpQrStUvWxYz
```

**B. iOS 클라이언트 ID (앱용)**

1. 다시 "+ 사용자 인증 정보 만들기" > "OAuth 클라이언트 ID"
2. 애플리케이션 유형: **"iOS"** 선택
3. 이름: `Refine iOS`
4. Bundle ID: `com.refine.app`
5. "만들기" 클릭
6. **클라이언트 ID** 복사 (형식: `xxx.apps.googleusercontent.com`)

**C. Android 클라이언트 ID (앱용)**

1. 다시 "+ 사용자 인증 정보 만들기" > "OAuth 클라이언트 ID"
2. 애플리케이션 유형: **"Android"** 선택
3. 이름: `Refine Android`
4. 패키지 이름: `com.refine.app`
5. **SHA-1 인증서 지문**: (개발용 임시 값)

   **개발용 SHA-1 지문 생성 방법:**
   ```bash
   # Expo Go로 테스트 시 (개발용)
   # Android Debug Keystore의 SHA-1 사용

   # Windows
   keytool -list -v -keystore "%USERPROFILE%\.android\debug.keystore" -alias androiddebugkey -storepass android -keypass android

   # Mac/Linux
   keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android
   ```

   출력에서 `SHA1:` 부분 복사 (예: `AB:CD:EF:12:34:56:...`)

6. "만들기" 클릭
7. **클라이언트 ID** 복사

**발급받은 3개의 클라이언트 ID 정리:**

| 클라이언트 ID 종류 | 어디에 사용? | 복사할 곳 |
|------------------|-------------|----------|
| **웹 클라이언트 ID** | 백엔드 서버 + 앱 | `.env` 파일 + `ProfileScreen.tsx:28` |
| **웹 클라이언트 Secret** | 백엔드 서버 | `.env` 파일 |
| **iOS 클라이언트 ID** | iOS 앱 | `ProfileScreen.tsx:29` |
| **Android 클라이언트 ID** | Android 앱 | `ProfileScreen.tsx:30` |

#### 2. Frontend 설정

**ProfileScreen.tsx에 클라이언트 ID 입력:**

파일 위치: `frontend/src/screens/ProfileScreen.tsx:27-30`

```typescript
const [googleRequest, googleResponse, googlePromptAsync] = Google.useIdTokenAuthRequest({
  clientId: '123456789012-web_client_id.apps.googleusercontent.com',        // 웹 클라이언트 ID
  iosClientId: '123456789012-ios_client_id.apps.googleusercontent.com',    // iOS 클라이언트 ID
  androidClientId: '123456789012-android_client_id.apps.googleusercontent.com', // Android 클라이언트 ID
});
```

⚠️ **주의**: 3개의 클라이언트 ID를 모두 정확하게 입력해야 합니다!

#### 3. Redirect URI (자동 처리됨)

Expo AuthSession을 사용하므로 **Redirect URI는 자동으로 생성**됩니다:
- 개발: `exp://localhost:19000`
- 프로덕션: `https://auth.expo.io/@your-expo-username/refine`

Google Cloud Console에 **별도로 Redirect URI를 등록할 필요 없습니다** (Expo가 자동 처리).

#### 4. 백엔드 환경 변수 설정

`.env` 파일에 웹 클라이언트 ID/Secret 입력:
```env
GOOGLE_CLIENT_ID=123456789012-abcdefghijklmnopqrstuvwxyz123456.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-AbCdEfGhIjKlMnOpQrStUvWxYz
```

---

### OAuth 없이 사용하기 (권장)

로그인 없이도 모든 기능을 사용할 수 있습니다:
- ✅ AI 텍스트 다듬기
- ✅ 히스토리 저장 (로컬 기기에만 저장)
- ✅ 모든 UX/UI 기능

"로그인 없이 계속하기" 버튼을 눌러 바로 사용할 수 있습니다.

---

## 📋 API 키 설정 요약표

아래 표를 참고하여 발급받은 API 키들을 정확한 위치에 입력하세요.

### 카카오 로그인 설정 요약

| API 키 종류 | 발급 위치 | 입력 파일 | 입력 위치 |
|------------|----------|----------|----------|
| **REST API 키** | Kakao Developers > 앱 설정 > 앱 키 | `.env` | `KAKAO_CLIENT_ID=여기에입력` |
| **네이티브 앱 키** | Kakao Developers > 앱 설정 > 앱 키 | `frontend/app.json` | `nativeAppKey: "여기에입력"` |
| **Redirect URI** | 직접 등록 필요 | Kakao Developers > 제품 설정 > 카카오 로그인 | 4개 URI 등록 (위 섹션 참고) |

### 구글 로그인 설정 요약

| API 키 종류 | 발급 위치 | 입력 파일 | 입력 위치 |
|------------|----------|----------|----------|
| **웹 클라이언트 ID** | Google Cloud Console > OAuth 클라이언트 ID (웹) | `.env` | `GOOGLE_CLIENT_ID=여기에입력` |
| **웹 클라이언트 Secret** | Google Cloud Console > OAuth 클라이언트 ID (웹) | `.env` | `GOOGLE_CLIENT_SECRET=여기에입력` |
| **웹 클라이언트 ID** (재사용) | 위와 동일 | `frontend/src/screens/ProfileScreen.tsx` | 28번 라인 `clientId` |
| **iOS 클라이언트 ID** | Google Cloud Console > OAuth 클라이언트 ID (iOS) | `frontend/src/screens/ProfileScreen.tsx` | 29번 라인 `iosClientId` |
| **Android 클라이언트 ID** | Google Cloud Console > OAuth 클라이언트 ID (Android) | `frontend/src/screens/ProfileScreen.tsx` | 30번 라인 `androidClientId` |
| **Redirect URI** | 자동 생성됨 (Expo AuthSession) | 등록 불필요 | - |

### 기타 필수 설정

| 설정 항목 | 발급 위치 | 입력 파일 | 입력 위치 | 필수 여부 |
|----------|----------|----------|----------|----------|
| **JWT Secret** | 직접 생성 (`openssl rand -base64 32`) | `.env` | `JWT_SECRET=여기에입력` | ✅ 필수 |
| **Frontend API URL** | 컴퓨터 IP 확인 (`ipconfig` 또는 `ifconfig`) | `frontend/src/services/api.ts` | 8번 라인 `API_BASE_URL` | ✅ 필수 (모바일 테스트 시) |
| **OpenAI API Key** | [OpenAI Platform](https://platform.openai.com/api-keys) | **앱의 프로필 화면** | AI 모델 설정에서 입력 | ⭕ 선택사항 |

### 설정 체크리스트

OAuth 로그인을 사용하려면 다음을 모두 완료해야 합니다:

**카카오 로그인:**
- [ ] REST API 키를 `.env`에 입력
- [ ] 네이티브 앱 키를 `app.json`에 입력
- [ ] 카카오 개발자 콘솔에 4개의 Redirect URI 등록
- [ ] 카카오 로그인 활성화 ON
- [ ] 동의 항목 설정 (닉네임, 이메일)
- [ ] Android/iOS 플랫폼 등록

**구글 로그인:**
- [ ] 웹 클라이언트 ID/Secret을 `.env`에 입력
- [ ] 3개의 클라이언트 ID를 `ProfileScreen.tsx`에 입력
- [ ] OAuth 동의 화면 구성 완료
- [ ] 범위(Scopes) 추가: email, profile, openid

---

### 실제 앱 배포 시 (EAS Build)

네이티브 앱으로 빌드하려면:

```bash
# 1. EAS CLI 설치
npm install -g eas-cli

# 2. Expo 계정으로 로그인
eas login

# 3. 프로젝트 설정
eas build:configure

# 4. iOS/Android 빌드
eas build --platform ios
eas build --platform android

# 5. 빌드 후 Redirect URI 업데이트
# https://auth.expo.io/@your-expo-username/refine 를
# 카카오/구글 콘솔에 추가
```

---

## 📁 프로젝트 구조

```
Refine/
├── backend/                      # Node.js + Express 백엔드
│   ├── src/
│   │   ├── database/            # DB 연결 및 마이그레이션
│   │   │   ├── db.ts           # PostgreSQL 연결 풀
│   │   │   └── migrate.ts      # 테이블 생성 및 스키마
│   │   ├── models/              # 데이터 모델
│   │   │   ├── User.ts         # 사용자 CRUD
│   │   │   └── Refinement.ts   # 텍스트 히스토리 CRUD
│   │   ├── routes/              # API 라우트
│   │   │   ├── authRoutes.ts   # 인증 API
│   │   │   └── refineRoutes.ts # 텍스트 다듬기 API (사용자 API 키 처리)
│   │   ├── services/            # 비즈니스 로직
│   │   │   └── aiService.ts    # 듀얼 AI 통합 (Ollama + OpenAI)
│   │   ├── middleware/          # Express 미들웨어
│   │   │   └── auth.ts         # JWT 인증 미들웨어
│   │   ├── utils/               # 유틸리티
│   │   │   └── jwt.ts          # JWT 생성/검증
│   │   └── index.ts             # 서버 엔트리 포인트
│   ├── Dockerfile
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/                     # React Native + Expo 앱
│   ├── src/
│   │   ├── screens/             # 화면 컴포넌트
│   │   │   ├── RefineScreen.tsx    # 텍스트 다듬기 화면
│   │   │   ├── HistoryScreen.tsx   # 히스토리 화면
│   │   │   └── ProfileScreen.tsx   # 프로필/로그인 화면
│   │   ├── navigation/          # 네비게이션 설정
│   │   │   └── AppNavigator.tsx    # Bottom Tabs 네비게이션
│   │   ├── context/             # React Context
│   │   │   └── AuthContext.tsx     # 인증 상태 관리
│   │   ├── services/            # API 통신
│   │   │   └── api.ts              # Axios 클라이언트
│   │   └── types/               # TypeScript 타입 정의
│   │       └── index.ts
│   ├── App.tsx
│   ├── app.json
│   └── package.json
│
├── docker-compose.yml           # Docker 오케스트레이션
├── .env                         # 환경 변수
├── .env.example                 # 환경 변수 예시
└── README.md
```

---

## 🐛 트러블슈팅

### 1. Docker 컨테이너가 시작되지 않는 경우

**증상**: `docker-compose up -d` 실행 시 에러 발생

**해결 방법**:
```bash
# 1. 모든 컨테이너 종료 및 삭제
docker-compose down

# 2. 강제 재빌드 (이미지 캐시 무시)
docker-compose up -d --build

# 3. 로그 확인
docker-compose logs -f

# 4. 특정 컨테이너 재시작
docker-compose restart backend
docker-compose restart postgres
```

**추가 확인사항**:
- Docker Desktop이 실행 중인지 확인
- 디스크 공간이 충분한지 확인
- 포트 3000, 5432가 다른 프로그램에서 사용 중이 아닌지 확인
  ```bash
  # Windows
  netstat -ano | findstr :3000
  netstat -ano | findstr :5432

  # Mac/Linux
  lsof -i :3000
  lsof -i :5432
  ```

### 2. 데이터베이스 연결 실패

**증상**: 백엔드 로그에 "Database connection failed" 표시

**해결 방법**:

1. **.env 파일과 docker-compose.yml 일치 확인**
   ```env
   # .env 파일
   POSTGRES_USER=refine_user
   POSTGRES_PASSWORD=refine_password
   POSTGRES_DB=refine_db
   ```
   ```yaml
   # docker-compose.yml (9-11행)
   POSTGRES_USER: refine_user
   POSTGRES_PASSWORD: refine_password
   POSTGRES_DB: refine_db
   ```

2. **PostgreSQL 컨테이너 상태 확인**
   ```bash
   docker-compose ps postgres
   # State가 "Up (healthy)"여야 함
   ```

3. **데이터베이스 직접 접속 테스트**
   ```bash
   docker exec -it refine-postgres psql -U refine_user -d refine_db
   # 성공하면 psql 프롬프트 표시됨
   ```

4. **볼륨 초기화 (마지막 수단 - 데이터 삭제됨)**
   ```bash
   docker-compose down -v
   docker volume rm refine_postgres_data
   docker-compose up -d
   ```

### 3. 프론트엔드에서 API 연결 실패

**증상**: 앱에서 "Network Error" 또는 "Failed to fetch" 에러

**진단**:
1. **백엔드 서버 상태 확인**
   ```bash
   # 헬스 체크 (정상이면 {"status":"ok"} 응답)
   curl http://localhost:3000/health

   # Docker 로그 확인
   docker-compose logs -f backend
   ```

2. **네트워크 연결 확인**
   - 모바일 기기와 개발 컴퓨터가 **같은 Wi-Fi**에 연결되어 있는지 확인
   - 회사/학교 네트워크에서는 방화벽 때문에 연결이 안 될 수 있음

**해결 방법**:

**실제 기기 테스트 시:**
```typescript
// frontend/src/services/api.ts

// Windows에서 IP 확인: ipconfig
// Mac/Linux에서 IP 확인: ifconfig 또는 ipconfig getifaddr en0

// 변경 전
const API_BASE_URL = 'http://localhost:3000/api';

// 변경 후 (실제 IP로 교체)
const API_BASE_URL = 'http://192.168.0.100:3000/api';
```

**Android 에뮬레이터 사용 시:**
```typescript
// localhost 대신 10.0.2.2 사용 (Android 에뮬레이터 특수 IP)
const API_BASE_URL = 'http://10.0.2.2:3000/api';
```

**iOS Simulator 사용 시:**
```typescript
// localhost 그대로 사용 가능
const API_BASE_URL = 'http://localhost:3000/api';
```

### 4. AI 텍스트 다듬기 실패

**증상**: 텍스트 다듬기 버튼 클릭 시 에러 발생

**원인 확인 및 해결:**

**A. Ollama 사용 중 에러 (기본)**

1. **Ollama 컨테이너 상태 확인**
   ```bash
   docker-compose ps ollama
   # State가 "Up"이어야 함

   # Ollama 로그 확인
   docker-compose logs -f ollama
   ```

2. **Ollama 모델 다운로드 확인**
   ```bash
   # Ollama 컨테이너 접속
   docker exec -it refine-ollama ollama list
   # llama3.2:3b 모델이 목록에 있어야 함

   # 모델이 없으면 수동 다운로드
   docker exec -it refine-ollama ollama pull llama3.2:3b
   ```

3. **Ollama API 테스트**
   ```bash
   curl http://localhost:11434/api/tags
   # 모델 목록이 반환되어야 함
   ```

4. **Ollama 재시작**
   ```bash
   docker-compose restart ollama
   docker-compose restart backend
   ```

**B. OpenAI 사용 중 에러 (사용자가 API 키 입력한 경우)**

1. **API 키 확인**
   - 앱의 프로필 화면 > AI 모델 설정에서 입력한 키 확인
   - sk-proj- 또는 sk-로 시작하는지 확인

2. **API 키 유효성 테스트**
   ```bash
   curl https://api.openai.com/v1/models \
     -H "Authorization: Bearer YOUR_API_KEY"
   # 성공하면 모델 리스트 반환
   ```

3. **OpenAI 계정 크레딧 확인**
   - [OpenAI Usage](https://platform.openai.com/usage)에서 크레딧 잔액 확인
   - 최소 $5 권장

4. **Rate Limit 에러**
   - 너무 많은 요청을 보냈을 경우 발생
   - 잠시 기다린 후 다시 시도
   - 또는 API 키 제거하고 무료 Ollama 사용

5. **API 키 제거 후 Ollama로 전환**
   - 프로필 화면 > "OpenAI API 키 변경" > 입력 필드 비우기 > "저장"

### 5. 로그인 버튼 클릭 시 아무 반응 없음

**증상**: 카카오/구글 로그인 버튼 클릭 시 Alert만 표시됨

**설명**:
- 현재 버전은 OAuth 네이티브 로그인 구현이 **미완성** 상태입니다
- `ProfileScreen.tsx:41-64`에는 Alert만 있고 실제 로그인 로직이 없습니다
- 백엔드 API는 준비되어 있지만, 프론트엔드 구현이 필요합니다

**해결 방법**:
1. **로그인 없이 사용** (권장)
   - "로그인 없이 계속하기" 버튼 클릭
   - 모든 기능 사용 가능 (히스토리는 로컬 저장)

2. **OAuth 로그인 구현 (개발자용)**
   - 위의 "📱 OAuth 로그인 상세 설정" 섹션 참고
   - `ProfileScreen.tsx`에 실제 로그인 코드 구현 필요
   - EAS Build로 네이티브 앱 빌드 필요

### 6. Expo Go에서 "Unable to resolve module" 에러

**증상**: 앱 실행 시 모듈을 찾을 수 없다는 에러

**해결 방법**:
```bash
cd frontend

# 캐시 삭제
rm -rf node_modules
rm package-lock.json

# 재설치
npm install

# Metro bundler 캐시 삭제
expo start -c
```

### 7. 히스토리가 저장되지 않음

**로그인 사용자:**
- 백엔드 로그 확인: `docker-compose logs -f backend`
- 데이터베이스 확인:
  ```bash
  docker exec -it refine-postgres psql -U refine_user -d refine_db
  SELECT * FROM refinements ORDER BY created_at DESC LIMIT 5;
  ```

**비로그인 사용자:**
- AsyncStorage 확인 (개발자 도구)
- Expo Go 앱 재시작
- 앱 데이터 삭제 후 재설치

### 8. 여전히 해결되지 않는 경우

**완전 초기화 (마지막 수단)**:

```bash
# 1. 모든 Docker 컨테이너 및 볼륨 삭제
docker-compose down -v
docker system prune -a

# 2. Frontend 초기화
cd frontend
rm -rf node_modules package-lock.json
npm install

# 3. Backend 재시작
cd ..
docker-compose up -d --build

# 4. 로그 확인
docker-compose logs -f
```

**도움 요청**:
- GitHub Issues에 에러 로그와 함께 문제 등록
- `.env` 파일은 **절대 공유하지 말 것** (보안 정보 포함)

---

## 📊 데이터베이스 스키마

### users 테이블
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE,
  name VARCHAR(255),
  provider VARCHAR(50) NOT NULL,      -- 'kakao' 또는 'google'
  provider_id VARCHAR(255) NOT NULL,  -- OAuth 제공자의 사용자 ID
  avatar_url TEXT,                    -- 프로필 이미지 URL
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(provider, provider_id)       -- 같은 제공자에서 중복 계정 방지
);
```

### refinements 테이블
```sql
CREATE TABLE refinements (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,  -- NULL이면 비로그인 사용자
  original_text TEXT NOT NULL,        -- 원본 문장
  refined_text TEXT NOT NULL,         -- 다듬어진 문장
  context VARCHAR(255),               -- 상황/컨텍스트
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 인덱스
CREATE INDEX idx_refinements_user_id ON refinements(user_id);
CREATE INDEX idx_refinements_created_at ON refinements(created_at DESC);
```

---

## 🔐 보안 고려사항

1. **JWT Secret**: `.env` 파일의 `JWT_SECRET`을 강력한 랜덤 문자열로 변경
2. **환경 변수**: `.env` 파일은 절대 Git에 커밋하지 않음 (`.gitignore`에 포함됨)
3. **HTTPS**: 운영 환경에서는 HTTPS 사용 필수
4. **Rate Limiting**: 운영 환경에서는 API Rate Limiting 추가 권장
5. **Input Validation**: Express Validator로 입력값 검증

---

## 📄 라이선스

MIT License

---

## 🤝 기여

이슈와 PR은 언제든 환영합니다!

---

## 📞 문의

문제가 발생하면 GitHub Issues에 등록해주세요.
