---
title: Zero Friction ML Projects Guide
pubDate: 2025-08-01
modDate: 2025-08-01
categories: ["project"]
description: some details 
slug: zero-friction
draft: false
pin: false
---
# Zero-Friction ML Projects: The 30-Min Stack That Saves Me Weeks

Over the past 2 years, I’ve probably started 20+ ML side projects. Most of them died—not because the idea was bad, but because the project structure was. One untracked Jupyter notebook becomes five, your model checkpoints are in random folders, and somewhere around “final\_final\_clean2.ipynb” you realize: this is a mess, and you don’t want to open it again.

This post is about not letting that happen—ever again.

---

### The goal

I wanted a project template that makes me fast without becoming fragile. Something I could spin up in under 5 minutes and that comes with:

* Pre-wired folders for code, configs, tests, and data
* Auto-formatting and linting built-in
* Pytest tests from day one
* CI that actually runs without me tweaking YAML for 6 hours

---

### The ingredients

#### 🧱 Cookiecutter: project scaffolding

I used the [cookiecutter-data-science](https://github.com/drivendata/cookiecutter-data-science) template. It gives me a clean layout with `src/`, `data/`, `tests/`, and `notebooks/` all split nicely.

```bash
pip install cookiecutter
cookiecutter gh:drivendata/cookiecutter-data-science
```

Then I delete the marketing fluff and deadweight folders I know I’ll never use.

---

#### 🧹 Pre-commit hooks: fix before you forget

Black for formatting, isort for import sorting, flake8 for linting.

```bash
pip install pre-commit
pre-commit install
```

Then I drop in a `.pre-commit-config.yaml`:

```yaml
repos:
  - repo: https://github.com/psf/black
    rev: 23.3.0
    hooks: [id: black]
  - repo: https://github.com/pre-commit/mirrors-isort
    rev: v5.12.0
    hooks: [id: isort]
  - repo: https://github.com/pycqa/flake8
    rev: 6.0.0
    hooks: [id: flake8]
```

Every time I commit, these run. If something’s broken, the commit fails. It sounds annoying. It isn’t. It’s freeing.

---

#### 🧪 Pytest: the safety net

Even a single test can save you later. I always add this as `tests/test_imports.py`:

```python
def test_sanity():
    import numpy, pandas, torch
    assert True
```

Then:

```bash
pytest --cov=src
```

Add coverage early and it feels weird not having it.

---

#### ⚙️ GitHub Actions: CI from day one

I’ve made peace with YAML. This goes in `.github/workflows/tests.yml`:

```yaml
name: tests
on: [push, pull_request]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-python@v2
        with:
          python-version: '3.11'
      - run: pip install -r requirements.txt
      - run: pytest --cov
```

Every push is now tested automatically. I don’t trust code that isn’t CI’d.

---

### How this helps me

Every post I’ll write this month, every experiment I’ll run, starts from this same skeleton. I no longer spend mental energy on whether my imports are clean, or my configs are versioned, or my repo is testable. It just is.

---

### What tripped me up

* GitHub Actions didn’t like my `3.12` Python version. Downgraded to `3.11` and all good.
* Pre-commit blocked my first commit because of a rogue tab in a `.ipynb`. Oops.
* Cookiecutter gave me folders like `models/` and `references/` that I just deleted.

---

### What I’m planning to add

* Hydra for managing configs properly (and reproducibly)
* Tox for multi-Python testing
* Mypy for static typing sanity

---

### Subtle resume thread

Most of my recent projects—whether it was ranking models, risk ETL, or even emotion-aware audio—they all needed the same thing: testable, maintainable code. This setup saved me from the “week 1 chaos → week 3 rewrite” trap more than once.

---

### TL;DR

Don’t wait until your codebase is 5000 lines deep to make it clean. You can build an ML repo that **just works**—with tests, linting, and CI—in 30 minutes.

That’s cheaper than one bad debugging session.

---

