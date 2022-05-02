// @ts-check
import * as yup from 'yup';
import i18n from 'i18next';
import axios from 'axios';
import _ from 'lodash';
import getWatcher from './view.js';
import resources from './locales/index.js';
import parsingRSS from './parsingRSS.js';

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
    .then(() => {
      state.i18n = i18nInstance;
      yup.setLocale({
        mixed: {
          default: state.i18n.t('message.validationError'),
        },
      });
    });
};

const getAllOriginsURL = (urlText) => {
  const pathAllOrigins = 'https://allorigins.hexlet.app/get';
  const urlFeed = new URL(pathAllOrigins);
  urlFeed.searchParams.set('url', urlText);
  urlFeed.searchParams.set('disableCache', 'true');
  return urlFeed.toString();
};

const saveFeed = (parsingFeed, watchedState, url) => {
  const foundFeed = watchedState.feeds.filter((feed) => (feed.url === url));
  if (foundFeed.length) return [foundFeed];
  const newFeed = {
    url,
    id: watchedState.id.feed,
    title: parsingFeed.title,
    description: parsingFeed.description,
  };
  watchedState.feeds.push(newFeed);
  watchedState.urlFeeds.push(url);
  watchedState.id.feed += 1;
  return newFeed;
};

const addNewPosts = (parsingPosts, watchedState, feed) => {
  const postsCurrFeed = watchedState.posts.filter((elem) => (elem.idFeed === feed.id));
  const postsNeedAdd = _.differenceBy(parsingPosts, postsCurrFeed, 'link');

  postsNeedAdd.forEach((item) => {
    item.idFeed = feed.id;
    const idPost = `${feed.id}-${watchedState.id.post}`;
    watchedState.id.post += 1;
    item.idPost = idPost;
    watchedState.posts.push(item);
  });
};

const processingResponse = (response, watchedState, url) => {
  const { data } = response;

  const { parsingFeed, parsingPosts } = parsingRSS(data, watchedState);
  if (parsingFeed === undefined) return;

  const feed = saveFeed(parsingFeed, watchedState, url);
  addNewPosts(parsingPosts, watchedState, feed);
};

const updatePostsByInterval = (watchedState, updateInterval) => {
  const { feeds } = watchedState;
  const arrPromises = feeds.map((feed) => axios(getAllOriginsURL(feed.url))
    .then((promise) => ({
      result: 'succes', value: promise, url: feed.url,
    }))
    .catch((error) => ({
      result: 'error', error,
    })));
  const resultPromise = Promise.all(arrPromises);
  resultPromise.then((arrResults) => {
    arrResults.forEach((onePromies) => {
      if (onePromies.result === 'succes') {
        processingResponse(onePromies.value, watchedState, onePromies.url);
      } else {
        watchedState.status = 'networkError';
        watchedState.view.message = 'error.networkError';
      }
    });
  }).finally(() => {
    setTimeout(updatePostsByInterval, updateInterval, watchedState, updateInterval);
  });
};

const initViewElements = (watchedState) => {
  watchedState.view.form = document.querySelector('form[name="form-search"]');
  watchedState.view.feedback = document.querySelector('.feedback');
  watchedState.view.feedDiv = document.querySelector('.feeds');
  watchedState.view.postsDiv = document.querySelector('.posts');
  watchedState.view.modal = document.getElementById('modal');
  watchedState.view.buttonSubmit = document.getElementById('submit');
  watchedState.view.urlInput = document.getElementById('url-input');
};

const appendFeed = (watchedState, urlPath) => {
  const schemaUrl = yup.string().required().url().trim()
    .notOneOf(watchedState.urlFeeds);
  watchedState.status = 'validation';
  watchedState.view.message = 'message.validation';
  schemaUrl.validate(urlPath)
    .then(() => {
      axios(getAllOriginsURL(urlPath)).then((response) => {
        watchedState.status = 'urlAccess';
        watchedState.view.message = 'message.urlAccess';
        processingResponse(response, watchedState, urlPath);
      })
        .catch(() => {
          watchedState.status = 'networkError';
          watchedState.view.message = 'error.networkError';
        });
    })
    .catch((e) => {
      if (e.type === 'notOneOf') {
        watchedState.status = 'urlAlreadyExist';
        watchedState.view.message = 'error.urlAlreadyExist';
      } else {
        watchedState.status = 'validationError';
        watchedState.view.message = 'error.validationError';
      }
    });
};

const main = () => {
  const updateInterval = 5000;
  const state = {
    feeds: [],
    urlFeeds: [],
    posts: [],
    id: {
      feed: 0,
      post: 0,
    },
    status: 'waitEnterURL',
    view: {
      viewedPosts: [],
      message: '',
    },
  };
  initI18next(state);
  const watchedState = getWatcher(state);
  initViewElements(watchedState);
  const form = document.querySelector('form[name="form-search"]');
  updatePostsByInterval(watchedState, updateInterval);
  form.addEventListener('submit', (objEvent) => {
    objEvent.preventDefault();
    const urlInput = document.getElementById('url-input');
    appendFeed(watchedState, urlInput.value);
  });
};

export default () => {
  main();
};
