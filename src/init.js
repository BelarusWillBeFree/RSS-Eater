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
    errors: '',
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
  });

  const watchedState = getWatcher(state);
  const urlInput = document.getElementById('url-input');
  const form = document.querySelector('form[name="form-search"]');

  watchedState.view.urlInput = urlInput;
  watchedState.view.feeds = document.querySelector('.feeds');

  const schemaUrl = yup.string().url().trim().required();

  form.addEventListener('submit', (objEvent) => {
    objEvent.preventDefault();
    const urlText = urlInput.value;
    schemaUrl.validate(urlText)
    .then(() => {
      if (urlNotSaved(watchedState, urlText)) {
        watchedState.listOfUrl.push(urlText);
        watchedState.status = 'refreshFeed';
      } else {
        watchedState.errors = 'errors.urlAlreadyExist'
        watchedState.status = 'errorValidation';
      }
    })
    .catch(() => {
      watchedState.errors = 'errors.ValidationError';
      watchedState.status = 'errorValidation';
    });
  });
}