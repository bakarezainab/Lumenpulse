import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { SentimentService } from '../src/sentiment/sentiment.service';
import { SentimentResponse } from '../src/sentiment/sentiment.service';
import { HealthResponse } from '../src/sentiment/sentiment.service';

// Mock interfaces for testing
interface MockedSentimentResponse extends SentimentResponse {
  sentiment: number;
}

interface MockedHealthResponse extends HealthResponse {
  status: string;
  timestamp: string;
  service: string;
}

describe('SentimentController (e2e)', () => {
  let app: INestApplication;
  let sentimentService: SentimentService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    sentimentService = moduleFixture.get<SentimentService>(SentimentService);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /sentiment/analyze', () => {
    it('should analyze sentiment successfully', () => {
      // Mock the service method with proper typing
      const mockResponse: MockedSentimentResponse = {
        sentiment: 0.85,
      };
      
      jest.spyOn(sentimentService, 'analyzeSentiment').mockResolvedValue(mockResponse);

      return request(app.getHttpServer())
        .post('/sentiment/analyze')
        .send({ text: 'This is amazing!' })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('sentiment');
          expect(typeof res.body.sentiment).toBe('number');
          expect(res.body.sentiment).toBeGreaterThanOrEqual(-1);
          expect(res.body.sentiment).toBeLessThanOrEqual(1);
        });
    });

    it('should return 400 for empty text', () => {
      return request(app.getHttpServer())
        .post('/sentiment/analyze')
        .send({ text: '' })
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toContain('Text cannot be empty');
        });
    });

    it('should return 400 for whitespace-only text', () => {
      return request(app.getHttpServer())
        .post('/sentiment/analyze')
        .send({ text: '   ' })
        .expect(400);
    });
  });

  describe('GET /sentiment/health', () => {
    it('should return health status', () => {
      // Mock the service method with proper typing
      const mockResponse: MockedHealthResponse = {
        status: 'healthy',
        timestamp: '2024-01-01T12:00:00Z',
        service: 'sentiment-analysis',
      };
      
      jest.spyOn(sentimentService, 'checkHealth').mockResolvedValue(mockResponse);

      return request(app.getHttpServer())
        .get('/sentiment/health')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('status', 'healthy');
          expect(res.body).toHaveProperty('timestamp');
          expect(res.body).toHaveProperty('service', 'sentiment-analysis');
        });
    });
  });
});
