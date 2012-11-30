Issues2CSV
==========

A collection of scripts, each of which logs into a GitHub account and downloads its issues into a spreadsheet for grading in ITC210. You'll need to edit the file to insert your username and password for authentication when you see "user:password". Right now, I recommend using the Python script--it's the most complete.

Run the scripts as {runtime} Issues2CSV.{extension} {repo owner} {repo name}. For example, to run the Python extractor on the ITC210 theme repo, we might run:

```
py Issues2CSV.py thomaswilburn itc210-theme
```
