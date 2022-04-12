// @ts-check
import * as yup from 'yup';
import getWatcher from './view.js';
import resources from './locales/index.js';
import i18n from 'i18next';
import axios from 'axios';
import _ from 'lodash';

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

const parsingRSS = (contents) => {
  const feed = {};
  const posts = [];
  const domParser = new DOMParser().parseFromString(contents, 'application/xml');
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
  return { parsingFeed:feed, parsingPosts:posts};
}

const getFeedURL = (urlText) => {
  const pathAllOrigins = `https://allorigins.hexlet.app/get`;
  const urlFeed = new URL(pathAllOrigins);
  urlFeed.searchParams.set('url', urlText);
  urlFeed.searchParams.set('disableCache', 'true');
  urlFeed.searchParams.set('charset', 'utf-8');
  return urlFeed.toString();
}

const updatePostsByFeed = (watchedState) => {
  const { feeds } = watchedState;
  feeds.forEach((feed, indexFeed) => {
    const { url } = feed;
    axios(getFeedURL(url)).then((response)=> {
      const { contents, status } = response.data;
      if (status.http_code !== 200) {
        watchedState.status = 'error';
        watchedState.message.pathI18n = 'error.loadError';
        return;
      }
      watchedState.status = 'refreshFeed';
      watchedState.message.pathI18n = 'message.urlAccess';
      const { parsingFeed, parsingPosts } = parsingRSS(contents);
      watchedState.feeds[indexFeed] = {url, id: feed.id, title: parsingFeed.title, description: parsingFeed.description};
      const postsCurrFeed = watchedState.posts.filter(elem => (elem.IDFeed === feed.id));
      const postsNeedAdd = _.differenceBy(parsingPosts, postsCurrFeed, 'link');
      postsNeedAdd.forEach(item => {
        item.IDFeed = feed.id;
        watchedState.posts.push(item);
      });
    })
    .catch(function () {
      watchedState.status = 'error';
      watchedState.message.pathI18n = 'error.networkError';
    });
  });
}

const startUpdateDataForInterval = (watchedState, updateInterval) => {
  updatePostsByFeed(watchedState);
  setTimeout(startUpdateDataForInterval, updateInterval, watchedState, updateInterval);
}

export default () => {
  const updateInterval = 5000;
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
  setTimeout(startUpdateDataForInterval, 0, watchedState, updateInterval);
  form.addEventListener('submit', (objEvent) => {
    objEvent.preventDefault();
    const urlPath = urlInput.value;
    watchedState.status = 'startValidation';
    schemaUrl.validate(urlPath)
    .then(() => {
      if (urlNotSaved(watchedState, urlPath)) {
        const id = watchedState.maxFeedIndex ++;
        watchedState.feeds.push({ url: urlPath, id });
        updatePostsByFeed(watchedState);
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