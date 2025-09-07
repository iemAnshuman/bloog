---
title: "Config-Driven Experiments: Reproducibility Without Regret"
pubDate: 2025-08-21
modDate: 2025-08-21
categories: ["mlops", "reproducibility", "hydra", "tooling"]
description: "Every broken experiment starts the same: 'What was different this time?' Here’s how I make sure I never have to ask."
slug: reproducibility-hydra
draft: false
pin: false
---

# Config-Driven Experiments: Reproducibility Without Regret

There are two kinds of ML experiments:

1. The ones where you change one thing, rerun, and compare.
2. The ones where you're not sure what changed, and nothing makes sense anymore.

This post is about building your workflows to *only allow* the first kind.

I've recently found out about **Hydra**, **pyproject-style config systems**, and **strict seeding**. It’s not sexy. But it means I can revisit a model I trained six months ago and know *exactly* what it did — no git blame, no sleuthing.

---

### The problem with ad-hoc runs

Let’s say you run a training script:

```bash
python train.py --lr 1e-3 --dropout 0.1 --encoder mini
```

Then you try another:

```bash
python train.py --lr 2e-4 --dropout 0.3 --encoder distil
```

Maybe you tracked it. Maybe you didn’t. Maybe you forgot to update the seed. Maybe one of them used the wrong tokenizer and you didn’t notice.

Multiply this by 10 runs, and you no longer know what you're comparing.

---

### Hydra to the rescue

Hydra is a config management tool that treats your hyperparams as *first-class citizens*. You build a config file like this:

```yaml
# config.yaml
defaults:
  - encoder: mini

lr: 0.001
dropout: 0.2
seed: 42
```

You can override at run time, or layer multiple configs:

```bash
python train.py lr=0.0005 dropout=0.3 encoder=distil
```

Hydra saves the **full resolved config** per run, alongside logs and outputs. No ambiguity. No surprises.

---

### Seeding everything

Randomness is good for training, but bad for debugging. I always seed:

* `random.seed()`
* `np.random.seed()`
* `torch.manual_seed()`
* `torch.cuda.manual_seed_all()`

And I fix:

* `torch.backends.cudnn.deterministic = True`
* `torch.use_deterministic_algorithms(True)`

> Yes, this slows things down a bit. Yes, it’s worth it.

---

### A little rigging helps a lot

I also use:

* `wandb` or `mlflow` to track metrics + artifacts
* `omegaconf` to pretty-print and save configs
* `pytest` to run sanity checks before I train
* `Makefile` to wrap common commands (`make train`, `make sweep`, etc.)

---

### Subtle résumé thread

In nearly every project I’ve built (Neuro-Ranker, EmotiTune, my finance risk work), reproducibility mattered more than performance. A model that’s 5% worse but fully traceable is **more valuable** than one that’s 5% better and mysterious. For a real research or production pipeline, **trust beats speed**.

---

### What broke

* Hydra’s multi-run sweep logs can be chaotic if you don’t set `run.dir` properly
* Wandb sometimes ignores offline mode unless you set `WANDB_MODE=offline`
* Default seeds in NumPy still shift between minor versions (!)

---

### What I’d explore next

* Versioning configs with `dvc`
* GitHub Actions that automatically log sweep outputs
* Linting configs for unused keys or conflicting overrides

---

### TL;DR

Reproducibility doesn’t happen by accident. You have to *design for it*.
Hydra + strict seeding + good config hygiene = less frustration, more insight.
