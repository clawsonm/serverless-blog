'use strict';

const uuid = require('uuid');
const AWS = require('aws-sdk');
const Post = require('./Post.js');

const dynamoDb = new AWS.DynamoDB.DocumentClient();

module.exports.hello = (event, context, callback) => {
  const response = {
    statusCode: 200,
    headers: {
      "Access-Control-Allow-Origin" : "*", // Required for CORS support to work
      "Access-Control-Allow-Credentials" : true // Required for cookies, authorization headers with HTTPS
    },
    body: JSON.stringify({
      message: 'Go Serverless v1.0! Your function executed successfully!',
      input: event
    })
  };

  callback(null, response);

  // Use this code if you don't use the http event with the LAMBDA-PROXY integration
  // callback(null, { message: 'Go Serverless v1.0! Your function executed successfully!', event });
};

module.exports.getPost = (event, context, callback) => {
  let slug = event.pathParameters.slug;
  let post = Post.get(slug);
  let response;
  post.then((post) => {
    if (post === false) {
      response = {
        statusCode: 404,
        headers: {
          "Access-Control-Allow-Origin" : "*", // Required for CORS support to work
          "Access-Control-Allow-Credentials" : true // Required for cookies, authorization headers with HTTPS
        },
        body: JSON.stringify({message: 'Not Found'})
      };
    } else {
      response = {
        statusCode: 200,
        headers: {
          "Access-Control-Allow-Origin" : "*", // Required for CORS support to work
          "Access-Control-Allow-Credentials" : true // Required for cookies, authorization headers with HTTPS
        },
        body: JSON.stringify(post)
      };
    }
    callback(null, response);
  }).catch((error) => {
    console.error(error);
    callback(new Error('Couldn\'t fetch Post.'));
    return;
  });
};

module.exports.listPosts = (event, context, callback) => {
  let posts = Post.list();
  posts.then((posts) => {
    const response = {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin" : "*", // Required for CORS support to work
        "Access-Control-Allow-Credentials" : true // Required for cookies, authorization headers with HTTPS
      },
      body: JSON.stringify({
        count: posts.length,
        posts: posts
      })
    };
    callback(null, response);
  }).catch((error) => {
    console.error(error);
    callback(new Error('Couldn\'t fetch list of Posts.'));
  });
};

module.exports.getCommentsForPost = (event, context, callback) => {
  let slug = event.pathParameters.slug;
  let params = {
    TableName: process.env.COMMENTS_TABLE,
    Key: {
      slug: slug
    }
  };
  dynamoDb.scan(params, (error, result) => {
    if (error) {
      console.error(error);
      callback(new Error('Couldn\'t fetch comments.'));
      return;
    }
    let results = result.Items.filter(result => result.moderated);
    const response = {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin" : "*", // Required for CORS support to work
        "Access-Control-Allow-Credentials" : true // Required for cookies, authorization headers with HTTPS
      },
      body: JSON.stringify({
        count: results.length,
        comments: results
      })
    };
    callback(null, response);
  });
};

module.exports.commentOnPost = (event, context, callback) => {
  const timestamp = new Date().getTime();
  let slug = event.pathParameters.slug;
  let data = JSON.parse(event.body);
  if (typeof data.name !== 'string' || typeof data.body !== 'string') {
    console.error('Validation failed');
    callback(new Error(`Validation failed while commenting on post: ${slug}`));
    return;
  }

  const params = {
    TableName: process.env.COMMENTS_TABLE,
    Item: {
      slug: slug,
      comment_id: uuid.v1(),
      name: data.name,
      body: data.body,
      created: timestamp,
      updated: timestamp,
      moderated: false
    }
  };

  dynamoDb.put(params, (error) => {
    if (error) {
      console.error(error);
      callback(new Error(`Failed to comment on post: ${slug}`));
      return;
    }

    const response = {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin" : "*", // Required for CORS support to work
        "Access-Control-Allow-Credentials" : true // Required for cookies, authorization headers with HTTPS
      },
      body: JSON.stringify(params.Item)
    };
    callback(null, response);
  });
};
