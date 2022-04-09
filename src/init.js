// @ts-check
import * as yup from 'yup';
import getWatcher from './view.js';
import resources from './locales/index.js';
import i18n from 'i18next';
import axios from 'axios';
//import url from 'url';

const urlNotSaved = (watchedState, urlText) => (
  watchedState.feeds.find(element => element.url === urlText)
   === undefined
  );

const initI18next = (state) => {
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
}

const parsingRSS = ({contents, contentType}) => {
  const typeForDOMParser = contentType === 'application/rss+xml' ? 'application/xml' : contentType;
  const feed = {};
  const posts = [];
  const domParser = new DOMParser().parseFromString(contents, typeForDOMParser);
  const title = domParser.querySelector('title');
  feed.title = title?.textContent;
  const description = domParser.querySelector('description');
  feed.description = description?.textContent;
  const items = domParser.querySelectorAll('item');
  Array.from(items).forEach((elemItem)=>{
    const [title, ] = Array.from(elemItem.children).filter(node => node.nodeName === 'title');
    const [link, ] = Array.from(elemItem.children).filter(node => node.nodeName === 'link');
    posts.push({
      title: title.textContent,
      link: link.textContent
    });
  });
  return { feed, posts};
}

const getFeedURL = (urlText) => {
  const pathAllOrigins = `https://allorigins.hexlet.app/get`;
  const urlFeed = new URL(pathAllOrigins);
  urlFeed.searchParams.set('url', urlText);
  urlFeed.searchParams.set('disableCache', 'true');
  urlFeed.searchParams.set('charset', 'utf-8');
  return urlFeed.toString();
}

const upgradeDataFromFeed = (watchedState, urlText) => {
  axios(getFeedURL(urlText)).then((response)=> {
    const { contents, status } = response.data;
    if (status.http_code !== 200) {
      watchedState.status = 'error';
      watchedState.message.pathI18n = 'error.loadError';
      return;
    }
    watchedState.status = 'refreshFeed';
    watchedState.message.pathI18n = 'message.urlAccess';
    const [contentType,] = status.content_type.split(';');
    const { feed, posts } = parsingRSS({ contents, contentType });

    posts.forEach(item => {
      item.feedIndex = watchedState.maxFeedIndex;
      watchedState.posts.push(item);
    });
    feed.url = urlText;
    feed.index = watchedState.maxFeedIndex++;
    watchedState.feeds.push(feed);
    })
    .catch(function () {
      watchedState.status = 'error';
      watchedState.message.pathI18n = 'error.networkError';
    })
}

export default () => {
  const state = {
    feeds: [],
    maxFeedIndex: 1,
    posts: [],
    status: 'waitEnterURL',
    message: {},
    view: {
      validateUrl: true,
      urlInput: undefined,
    },
  };
  initI18next(state);
  const watchedState = getWatcher(state);

  const urlInput = document.getElementById('url-input');
  const form = document.querySelector('form[name="form-search"]');
  watchedState.view.form = form;
  watchedState.view.feedback = document.querySelector('.feedback');
  watchedState.view.feedDiv = document.querySelector('.feeds');
  watchedState.view.postsDiv = document.querySelector('.posts');
  watchedState.view.urlInput = urlInput;

  const schemaUrl = yup.string().required().url().trim();
  form.addEventListener('submit', (objEvent) => {
    objEvent.preventDefault();
    const urlPath = urlInput.value;
    watchedState.status = 'startValidation';
    schemaUrl.validate(urlPath)
    .then(() => {
      if (urlNotSaved(watchedState, urlPath)) {
        upgradeDataFromFeed(watchedState, urlPath);
      } else {
        watchedState.status = 'error';
        watchedState.message.pathI18n = 'error.urlAlreadyExist';
      }
    })
    .catch(() => {
      watchedState.status = 'error';
      watchedState.message.pathI18n = 'error.validationError';
    });
  });
}