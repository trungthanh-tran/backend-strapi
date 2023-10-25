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
  };
}

export interface QuizQuizz extends Schema.Component {
  collectionName: 'components_quiz_quizzes';
  info: {
    displayName: 'Quizz';
  };
  attributes: {
    title: Attribute.String;
    image: Attribute.String;
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
