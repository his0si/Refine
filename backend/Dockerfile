FROM node:18-alpine

WORKDIR /app

# 의존성 설치를 위한 package.json 복사
COPY package*.json ./

# 의존성 설치
RUN npm install

# 소스 코드 복사
COPY . .

# TypeScript 빌드
RUN npm run build

# 포트 노출
EXPOSE 3000

# 애플리케이션 시작
CMD ["npm", "start"]
