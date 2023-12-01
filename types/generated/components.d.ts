import type { Schema, Attribute } from '@strapi/strapi';

export interface QuizEvent extends Schema.Component {
  collectionName: 'components_quiz_events';
  info: {
    displayName: 'event';
    description: '';
  };
  attributes: {
    youtube_id: Attribute.String;
    question: Attribute.String;
    answers: Attribute.Component<'quiz.quizz', true>;
    correct_answer: Attribute.String & Attribute.Required & Attribute.Private;
  };
}

export interface QuizQuizz extends Schema.Component {
  collectionName: 'components_quiz_quizzes';
  info: {
    displayName: 'Quizz';
    description: '';
  };
  attributes: {
    title: Attribute.String;
  };
}

declare module '@strapi/types' {
  export module Shared {
    export interface Components {
      'quiz.event': QuizEvent;
      'quiz.quizz': QuizQuizz;
    }
  }
}
