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
- **OpenAI API (GPT-4)** - AI 텍스트 리파인먼트
- **JWT** - 인증 토큰 관리
- **Passport.js** - OAuth 인증

### 인프라
- **Docker & Docker Compose** - 컨테이너화 및 오케스트레이션
- **영구 볼륨** - 데이터 지속성 보장 (도커 재시작/삭제 시에도 데이터 유지)

---

## ⭐ 구현된 모든 기능

### 1. AI 텍스트 다듬기 (Core Feature)

**위치**: `frontend/src/screens/RefineScreen.tsx` + `backend/src/services/aiService.ts`

#### 기능 상세:
- 사용자가 입력한 원본 문장을 GPT-4를 통해 공적인 상황에 맞게 다듬기
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

#### 기술 구현:
- **OpenAI GPT-4 API** 사용
- 시스템 프롬프트: 한국어 공적 글쓰기 전문가 역할
- Temperature: 0.7 (적절한 창의성과 일관성)
- Max Tokens: 500

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

---

### 5. JWT 기반 인증 시스템

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

### 6. Docker 영구 볼륨 (Persistent Volume)

**위치**: `docker-compose.yml`

#### 핵심 특징:
- PostgreSQL 데이터를 영구 볼륨에 저장
- 도커 컨테이너를 중지, 재시작, 삭제해도 데이터 유지
- `docker system prune -a`로 모든 캐시를 삭제해도 데이터 유지

#### 볼륨 구성:
```yaml
volumes:
  postgres_data:
    driver: local
```

#### 데이터 보호 시나리오:
✅ `docker-compose down` → 데이터 유지
✅ `docker-compose restart` → 데이터 유지
✅ `docker system prune -a` → 데이터 유지
✅ Docker Desktop 재시작 → 데이터 유지
❌ `docker-compose down -v` → 데이터 삭제 (볼륨 명시적 삭제)
❌ `docker volume rm refine_postgres_data` → 데이터 삭제

---

### 7. RESTful API 엔드포인트

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

### 8. UX/UI 특징

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

- **Docker & Docker Compose** 설치
- **Node.js 18+** (로컬 개발 시)
- **Expo CLI** (모바일 앱 개발 시)
- **OpenAI API Key** ([발급 링크](https://platform.openai.com/api-keys))

### 1단계: 환경 변수 설정

루트 디렉토리의 `.env` 파일을 열고 필수 값을 입력하세요:

```env
# 필수
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxx

# JWT Secret (운영 환경에서는 강력한 랜덤 문자열로 변경)
JWT_SECRET=your-super-secret-key-change-in-production

# 선택사항 (OAuth 로그인 사용 시)
KAKAO_CLIENT_ID=your_kakao_client_id
KAKAO_CLIENT_SECRET=your_kakao_client_secret
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

### 2단계: Docker로 백엔드 실행

```bash
# PostgreSQL과 백엔드 서버 실행
docker-compose up -d

# 로그 확인
docker-compose logs -f backend
```

성공적으로 실행되면:
```
✅ Database connected
Running database migrations...
Migration completed successfully!
🚀 Server running on port 3000
📝 Health check: http://localhost:3000/health
🔧 API endpoint: http://localhost:3000/api
🔐 Auth endpoint: http://localhost:3000/api/auth
```

### 3단계: 프론트엔드 실행

```bash
cd frontend
npm install
npm start
```

Expo 개발 서버가 시작되고 QR 코드가 표시됩니다.

### 4단계: 모바일에서 실행

- **iOS**: App Store에서 "Expo Go" 다운로드 후 QR 코드 스캔
- **Android**: Play Store에서 "Expo Go" 다운로드 후 QR 코드 스캔
- **에뮬레이터**: `npm run ios` 또는 `npm run android`

**중요**: 모바일 기기와 개발 서버가 같은 Wi-Fi 네트워크에 연결되어 있어야 합니다.

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
# 볼륨 포함 모두 삭제
docker-compose down -v

# 특정 볼륨 삭제
docker volume rm refine_postgres_data
```

### 볼륨 확인
```bash
# 볼륨 목록
docker volume ls

# 볼륨 상세 정보
docker volume inspect refine_postgres_data
```

---

## 📱 OAuth 로그인 설정 (선택사항)

### 카카오 로그인
1. [Kakao Developers](https://developers.kakao.com/)에서 앱 생성
2. 플랫폼 설정: 네이티브 앱 추가
3. Redirect URI 설정
4. `.env` 파일에 Client ID/Secret 입력
5. `app.json`에 카카오 설정 추가

### 구글 로그인
1. [Google Cloud Console](https://console.cloud.google.com/)에서 프로젝트 생성
2. OAuth 2.0 클라이언트 ID 생성
3. Android/iOS 클라이언트 ID 각각 생성
4. `.env` 파일에 Client ID/Secret 입력
5. `app.json`에 구글 설정 추가

**참고**: 현재 버전은 네이티브 OAuth가 아닌 WebView 기반 로그인을 사용합니다. 실제 앱 배포 시 `eas build`로 네이티브 앱을 빌드해야 합니다.

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
│   │   │   └── refineRoutes.ts # 텍스트 다듬기 API
│   │   ├── services/            # 비즈니스 로직
│   │   │   └── aiService.ts    # OpenAI GPT-4 통합
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

```bash
docker-compose down
docker-compose up -d --build
```

### 2. 데이터베이스 연결 실패

`.env` 파일의 데이터베이스 설정이 `docker-compose.yml`과 일치하는지 확인하세요.

### 3. 프론트엔드에서 API 연결 실패

1. 백엔드 서버가 실행 중인지 확인:
   ```bash
   curl http://localhost:3000/health
   ```

2. 모바일 기기와 개발 서버가 같은 네트워크에 있는지 확인

3. `frontend/src/services/api.ts`의 `API_BASE_URL`을 컴퓨터의 로컬 IP로 변경:
   ```typescript
   // Windows에서 IP 확인: ipconfig
   // Mac/Linux에서 IP 확인: ifconfig
   const API_BASE_URL = 'http://192.168.x.x:3000/api';
   ```

### 4. OpenAI API 에러

- API 키가 올바른지 확인
- OpenAI 계정에 충분한 크레딧이 있는지 확인
- API 사용량 제한에 도달하지 않았는지 확인

### 5. 로그인 버튼 클릭 시 아무 반응 없음

- 현재 버전은 OAuth 설정이 필요한 네이티브 로그인을 지원하지 않습니다
- "로그인 없이 계속하기"를 선택하여 모든 기능 사용 가능
- 실제 OAuth 로그인은 네이티브 앱 빌드 후 사용 가능

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
