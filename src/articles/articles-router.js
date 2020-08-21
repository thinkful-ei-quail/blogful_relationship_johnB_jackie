const express = require('express')
const xss = require('xss')
const path = require('path')
const ArticlesService = require('./articles-service')

const articlesRouter = express.Router()
const jsonParser = express.json()

const sanitizedArticle = article => ({
  id: article.id,
  date_published: article.date_published,
  title: xss(article.title),
  style: article.style,
  content: xss(article.content),
})

articlesRouter
  .route('/')
  .get((req, res, next) => {
    const knexInstance = req.app.get('db')
    ArticlesService.getAllArticles(knexInstance)
      .then(articles => {
        res.json(articles.map(sanitizedArticle))
      })
      .catch(next)
  })
  .post(jsonParser, (req, res, next) => {
    const { title, content, style } = req.body
    let newArticle = { title, content, style }

    for( const [key, value] of Object.entries(newArticle)) {
      if(value == null) {
        return res.status(400).json({
          error: { message: `Missing "${key}" in request body`}
        })
      }
    }
    
    ArticlesService.insertArticle(req.app.get('db'), newArticle)
      .then(article => {
        res
          .status(201)
          .location(path.posix.join(req.originalUrl + `/${article.id}`))
          .json(sanitizedArticle(article))
      })
      .catch(next)
  })

articlesRouter
  .route('/:article_id')
  .all((req, res, next) => {
    ArticlesService.getById(req.app.get('db'), req.params.article_id)
      .then(article => {
        if(!article) {
          return res.status(404).json({
            error: { message: 'Article doesn\'t exist' }
          })
        }
        res.article = article //save the article for the next middleware
        next() //call next so the article gets passed to the next middleware
      })
      .catch(next)
  })
  .get((req, res, next) => {
    res.json({
      id: res.article.id,
      style: res.article.style,
      title: xss(res.article.title),
      content: xss(res.article.content),
      date_published: res.article.date_published
    })
  })
  .delete((req, res, next) => {
    ArticlesService.deleteArticle(req.app.get('db'), req.params.article_id)
      .then(() => {
        res.status(204).end()
      })
      .catch(next)
  })
  .patch(jsonParser, (req, res, next) => {
    const { title, content, style } = req.body
    const articleToUpdate = { title, content, style}

    const numberOfValues = Object.values(articleToUpdate).filter(Boolean).length
    if(numberOfValues === 0) {
      return res.status(400).json({
        error: { message: 'Request body must contain either \'title\', \'style\', or \'content\''}
      })
    }

    ArticlesService.updateArticle(req.app.get('db'), req.params.article_id, articleToUpdate)
      .then(() => {
        res.status(204).end()
      })
      .catch(next)
  })

module.exports = articlesRouter
