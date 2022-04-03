// @ts-check
import * as yup from 'yup';
import getWatcher from './view.js';
import resources from './locales/index.js';
import i18n from 'i18next';

const urlNotSaved = (watchedState, urlText) => (watchedState.listOfUrl.find(element => element === urlText) === undefined);

export default () => {
  const state = {
    listOfUrl: [],
    status: 'waitEnterURL',
    message: {},
    view: {
      validateUrl: true,
      urlInput: undefined,
    },
  };
  const defaultLanguage = 'ru';
  const i18nInstance = i18n.createInstance();
  i18nInstance.init({
    lng: defaultLanguage,
    debug: false,
    resources: {
      ru: resources.ru,
    },
  })
  .then(()=>{
    state.i18n = i18nInstance;
    yup.setLocale({
      mixed: {
        default: state.i18n.t('message.validationError'),
      },
    });
    });
  const watchedState = getWatcher(state);
  const urlInput = document.getElementById('url-input');
  const form = document.querySelector('form[name="form-search"]');
  const feedback = document.querySelector('.feedback');
  watchedState.view.feedback = feedback;

  watchedState.view.urlInput = urlInput;
  watchedState.view.feeds = document.querySelector('.feeds');

//      required: 'URL не должен быть пустым',
  const schemaUrl = yup.string().required().url().trim();
  form.addEventListener('submit', (objEvent) => {
    objEvent.preventDefault();
    const urlText = urlInput.value;
    schemaUrl.validate(urlText)
    .then(() => {
      if (urlNotSaved(watchedState, urlText)) {
        watchedState.listOfUrl.push(urlText);
        watchedState.status = 'refreshFeed';
        watchedState.message.pathI18n = 'message.urlAccess';
      } else {
        watchedState.status = 'validationError';
        watchedState.message.pathI18n = 'message.urlAlreadyExist'
      }
    })
    .catch(() => {
      watchedState.status = 'validationError';
      watchedState.message.pathI18n = state.i18n.t('message.validationError');
    });
  });
}