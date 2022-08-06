# Siteswap Search Service

You can execute an infinite search of siteswaps with a regular expression style notation.
In addition, by using the Siteswap Query Language (SsQL), you can specify the search method and the display method of results in detail.

# File list

<dl>
  <dt>index.html</dt>
    <dd>This is the service entrance page. Usually redirect to the standard version.</dd>
  <dt>standard.html</dt>
    <dd>This is the standard version page. Here you can describe the search pattern and set various conditions.</dd>
  <dt>standard.css</dt>
    <dd>The style sheet for the standard version.</dd>
  <dt>standard.js</dt>
    <dd>This is a controller that receives the input of the standard version and outputs the resulting patterns.</dd>
  <dt>pattern.js</dt>
    <dd>The grammar object and the syntax converter of the search pattern.</dd>
  <dt>parser.js</dt>
    <dd>Classes for parser, token, syntax tree, and state stack.</dd>
  <dt>iterator.js</dt>
    <dd>Classes for pattern creator, pattern value, and 4 types of iterators.</dd>
  <dt>notation.html</dt>
    <dd>This page explains how to write search patterns.</dd>
  <dt>professional.html</dt>
    <dd>This is the professional version page. Here you can use SsQL to search for siteswaps.</dd>
  <dt>professional.css</dt>
    <dd>The style sheet for the professional version.</dd>
  <dt>professional.js</dt>
    <dd>This is a controller that receives the input of the professional version and outputs the resulting patterns.</dd>
  <dt>query.js</dt>
    <dd>The grammar object and the syntax converter of SsQL.</dd>
  <dt>syntax.js</dt>
    <dd>Classes for various objects that make up the syntax.</dd>
  <dt>semantic.js</dt>
    <dd>A class for semantic analysis.</dd>
  <dt>ssql.html</dt>
    <dd>This page explains how to write SsQL.</dd>
  <dt>test.html</dt>
    <dd>This is a page for testing this service.</dd>
  <dt>test.css</dt>
    <dd>The style sheet for the test page.</dd>
  <dt>test.js</dt>
    <dd>This is a controller that receives the input of the test page and outputs the test result to the table.</dd>
</dl>

