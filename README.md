# Siteswap Search Service

https://7131.github.io/search/

There are two versions of the siteswap search service: standard and professional.
In both cases, only vanilla siteswaps are covered.
The professional version is upward compatible with the standard version, so it can generate everything that the standard version can generate.

# Standard version

The standard version is designed to easily generate siteswaps in regular expression style notation.
For example, if you want to generate siteswaps with a height of 5 or less, simply specify the following and press the "Search" button.

```
[0-5]+
```

For ease of use, only juggleable patterns are searched by default, and the search terminates after 100 hits or 3 seconds.
You can set conditions such as "only 3 balls" or "excluding the same siteswap".

# Professional version

In the professional version, the Siteswap Query Language (SsQL) allows you to specify in detail how to search and display results.
This version can generate an infinite number of patterns until physical constraints are reached.
If the number of patterns generated is finite, a full search can be performed.

Siteswaps with a height of 5 or less is expressed in SsQL as follows:

```SQL
FROM "[0-5]+"
WHERE $0.valid AND $0.balls == 3
SELECT DISTINCT $0.standard
```

If you do not write a LIMIT clause, it will continue to generate infinitely, so stop at the appropriate point.
