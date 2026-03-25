import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RecommendationChatComponent } from './recommendation-chat.component';
import { RecommendationChatbotService } from '../../shared/services/recommendation-chatbot.service';
import { of } from 'rxjs';

describe('RecommendationChatComponent', () => {
  let component: RecommendationChatComponent;
  let fixture: ComponentFixture<RecommendationChatComponent>;
  let mockRecommendationService: jasmine.SpyObj<RecommendationChatbotService>;

  beforeEach(async () => {
    const spy = jasmine.createSpyObj('RecommendationChatbotService', [
      'startConversation',
      'chat',
      'formatHistory',
      'getPackDetails',
      'generateProfileSummary'
    ]);

    await TestBed.configureTestingModule({
      declarations: [RecommendationChatComponent],
      imports: [NoopAnimationsModule],
      providers: [
        { provide: RecommendationChatbotService, useValue: spy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(RecommendationChatComponent);
    component = fixture.componentInstance;
    mockRecommendationService = TestBed.inject(RecommendationChatbotService) as any;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should start conversation on init', () => {
    const mockResponse = {
      response: 'Bonjour ! Quel est votre âge ?',
      progress: 0,
      is_complete: false,
      collected_data: {}
    };

    mockRecommendationService.startConversation.and.returnValue(of(mockResponse));

    component.ngOnInit();
    fixture.detectChanges();

    expect(mockRecommendationService.startConversation).toHaveBeenCalled();
    expect(component.messages.length).toBe(1);
    expect(component.messages[0].text).toBe(mockResponse.response);
    expect(component.messages[0].sender).toBe('ai');
  });

  it('should send message and handle response', () => {
    const mockHistory = [
      { role: 'assistant', content: 'Quel est votre âge ?' },
      { role: 'user', content: '30' }
    ];

    const mockResponse = {
      response: 'Quel est votre sexe ?',
      next_field: 'sexe',
      progress: 10,
      is_complete: false,
      collected_data: { age: 30 }
    };

    mockRecommendationService.formatHistory.and.returnValue(mockHistory);
    mockRecommendationService.chat.and.returnValue(of(mockResponse));

    component.userInput = '30';
    component.sendMessage();
    fixture.detectChanges();

    expect(mockRecommendationService.chat).toHaveBeenCalledWith({
      message: '30',
      conversation_history: mockHistory
    });
    expect(component.messages.length).toBe(2);
    expect(component.progress).toBe(10);
    expect(component.collectedData).toEqual({ age: 30 });
  });

  it('should handle recommendations in response', () => {
    const mockResponse = {
      response: 'Voici les packs recommandés...',
      is_complete: true,
      recommendations: {
        scoredPacks: [
          { idPack: '1', nomPack: 'Pack Basic', score: 85 }
        ]
      }
    };

    mockRecommendationService.chat.and.returnValue(of(mockResponse));
    mockRecommendationService.formatHistory.and.returnValue([]);

    component.sendMessage();
    fixture.detectChanges();

    expect(component.isComplete).toBe(true);
    expect(component.recommendations.length).toBe(1);
    expect(component.recommendations[0].nomPack).toBe('Pack Basic');
  });

  it('should reset conversation', () => {
    component.messages = [{ text: 'test', sender: 'user', time: new Date() }];
    component.progress = 50;
    component.isComplete = true;
    component.collectedData = { age: 30 };
    component.recommendations = [{ idPack: '1', nomPack: 'Pack Basic' }];

    mockRecommendationService.startConversation.and.returnValue(of({
      response: 'Bonjour ! Quel est votre âge ?',
      progress: 0,
      is_complete: false,
      collected_data: {}
    }));

    component.resetConversation();
    fixture.detectChanges();

    expect(component.messages.length).toBe(1);
    expect(component.progress).toBe(0);
    expect(component.isComplete).toBe(false);
    expect(component.collectedData).toEqual({});
    expect(component.recommendations.length).toBe(0);
  });

  it('should format message correctly', () => {
    const boldText = component.formatMessage('Ce texte est **gras**');
    expect(boldText).toContain('<strong>gras</strong>');

    const listText = component.formatMessage('• Item 1\n• Item 2');
    expect(listText).toContain('<li>Item 1</li>');
    expect(listText).toContain('<li>Item 2</li>');
  });

  it('should generate profile summary', () => {
    component.collectedData = {
      age: 30,
      sexe: 'M',
      profession: 'Ingénieur'
    };

    const summary = component.getProfileSummary();
    expect(summary).toContain('Votre profil d\'assurance');
    expect(summary).toContain('30');
    expect(summary).toContain('Ingénieur');
  });
});
