// @ts-check
import * as yup from 'yup';
import getWatcher from './watcher.js';

export default () => {
  const state = {
    listOfUrl: [],
    view: {
      validateUrl: true,
      urlInput: undefined,
    },
  };
  const watchedState = getWatcher(state);
  const urlInput = document.getElementById('url-input');
  const form = document.querySelector('form[name="form-search"]');
  watchedState.view.urlInput = urlInput;

  form.addEventListener('submit', (objEvent) => {
    objEvent.preventDefault();
    const urlText = urlInput.value;

    const schemaUrl = yup.string().url();
    schemaUrl.isValid(urlText)
    .then((validateUrl) => {
      const foundUrl = watchedState.listOfUrl
      .find(element => element === urlText);
      const urlNotSaved = foundUrl === undefined;
      if (validateUrl && urlNotSaved) {
        watchedState.listOfUrl.push(urlText);
      }
      watchedState.view.validateUrl = validateUrl && urlNotSaved;
    });
  });
}