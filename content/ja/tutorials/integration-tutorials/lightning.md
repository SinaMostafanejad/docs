---
title: PyTorch Lightning
menu:
  tutorials:
    identifier: ja-tutorials-integration-tutorials-lightning
    parent: integration-tutorials
weight: 2
---

{{< cta-button colabLink="https://colab.research.google.com/github/wandb/examples/blob/master/colabs/pytorch-lightning/Image_Classification_using_PyTorch_Lightning.ipynb" >}}
PyTorch Lightning を使用して画像分類パイプラインを構築します。この [style guide](https://lightning.ai/docs/pytorch/stable/starter/style_guide.html) に従って、コードの可読性と再現性を高めます。これについての詳しい説明は [こちら](https://wandb.ai/wandb/wandb-lightning/reports/Image-Classification-using-PyTorch-Lightning--VmlldzoyODk1NzY) で確認できます。

## PyTorch Lightning と W&B の設定

このチュートリアルでは、PyTorch Lightning と Weights and Biases が必要です。

```shell
pip install lightning -q
pip install wandb -qU
```

```python
import lightning.pytorch as pl

# お気に入りの機械学習追跡ツール
from lightning.pytorch.loggers import WandbLogger

import torch
from torch import nn
from torch.nn import functional as F
from torch.utils.data import random_split, DataLoader

from torchmetrics import Accuracy

from torchvision import transforms
from torchvision.datasets import CIFAR10

import wandb
```

次に、あなたの wandb アカウントにログインする必要があります。

```
wandb.login()
```

## DataModule - 欲しかったデータパイプライン

DataModules は、データ関連のフックを LightningModule から分離する方法であり、データセットに依存しないモデルを開発できます。

データパイプラインを共有可能かつ再利用可能なクラスに整理します。Datamodule は、PyTorch のデータプロセシングに関与する5つのステップをカプセル化します:
- ダウンロード / トークン化 / プロセシング
- クリーンアップと（必要に応じて）ディスクに保存
- Dataset 内にロード
- 変換を適用（回転、トークン化など）
- DataLoader 内にラップ

Datamodules についての詳細は [こちら](https://lightning.ai/docs/pytorch/stable/data/datamodule.html) で確認できます。Cifar-10 データセット用の datamodule を作成してみましょう。

```
class CIFAR10DataModule(pl.LightningDataModule):
    def __init__(self, batch_size, data_dir: str = './'):
        super().__init__()
        self.data_dir = data_dir
        self.batch_size = batch_size

        self.transform = transforms.Compose([
            transforms.ToTensor(),
            transforms.Normalize((0.5, 0.5, 0.5), (0.5, 0.5, 0.5))
        ])
        
        self.num_classes = 10
    
    def prepare_data(self):
        CIFAR10(self.data_dir, train=True, download=True)
        CIFAR10(self.data_dir, train=False, download=True)
    
    def setup(self, stage=None):
        # dataloaders で使用するための トレイニング/検証 データセットを割り当てます
        if stage == 'fit' or stage is None:
            cifar_full = CIFAR10(self.data_dir, train=True, transform=self.transform)
            self.cifar_train, self.cifar_val = random_split(cifar_full, [45000, 5000])

        # dataloader(s) で使用するためのテストデータセットを割り当てます
        if stage == 'test' or stage is None:
            self.cifar_test = CIFAR10(self.data_dir, train=False, transform=self.transform)
    
    def train_dataloader(self):
        return DataLoader(self.cifar_train, batch_size=self.batch_size, shuffle=True)

    def val_dataloader(self):
        return DataLoader(self.cifar_val, batch_size=self.batch_size)

    def test_dataloader(self):
        return DataLoader(self.cifar_test, batch_size=self.batch_size)
```

## コールバック

コールバックとは、プロジェクト全体で再利用可能な自立型プログラムです。PyTorch Lightning には、よく使用される [組み込みのコールバック](https://lightning.ai/docs/pytorch/latest/extensions/callbacks.html#built-in-callbacks) がいくつか用意されています。
PyTorch Lightning のコールバックについてもっと知るには [こちら](https://lightning.ai/docs/pytorch/latest/extensions/callbacks.html) を参照してください。

### 組み込みコールバック

このチュートリアルでは、[Early Stopping](https://lightning.ai/docs/pytorch/latest/api/lightning.pytorch.callbacks.EarlyStopping.html#lightning.callbacks.EarlyStopping) と [Model Checkpoint](https://lightning.ai/docs/pytorch/latest/api/lightning.pytorch.callbacks.ModelCheckpoint.html#pytorch_lightning.callbacks.ModelCheckpoint) の組み込みコールバックを使用します。それらは `Trainer` に渡すことができます。

### カスタムコールバック
Keras のカスタムコールバックに慣れている場合、PyTorch パイプラインで同様のことができる能力は、まるでケーキの上のサクランボのようなものです。

画像分類を行っているため、モデルの予測を一部の画像サンプルで視覚化する能力が役立ちます。これはコールバックの形で、モデルの初期段階でのデバッグを助けることができます。

```
class ImagePredictionLogger(pl.callbacks.Callback):
    def __init__(self, val_samples, num_samples=32):
        super().__init__()
        self.num_samples = num_samples
        self.val_imgs, self.val_labels = val_samples
    
    def on_validation_epoch_end(self, trainer, pl_module):
        # テンソルを CPU に移動する
        val_imgs = self.val_imgs.to(device=pl_module.device)
        val_labels = self.val_labels.to(device=pl_module.device)
        # モデルの予測を取得
        logits = pl_module(val_imgs)
        preds = torch.argmax(logits, -1)
        # wandb Image として画像をログする
        trainer.logger.experiment.log({
            "examples":[wandb.Image(x, caption=f"Pred:{pred}, Label:{y}") 
                           for x, pred, y in zip(val_imgs[:self.num_samples], 
                                                 preds[:self.num_samples], 
                                                 val_labels[:self.num_samples])]
            })
        
```

## LightningModule - システムの定義

LightningModule はモデルではなくシステムを定義します。ここでのシステムは、すべての研究コードを単一のクラスにグループ化して自己完結型にします。 `LightningModule` はあなたの PyTorch コードを 5 つのセクションに編成します:
- 計算 (`__init__`)。
- トレインループ (`training_step`)
- 検証ループ (`validation_step`)
- テストループ (`test_step`)
- オプティマイザー (`configure_optimizers`)

このように、データセットに依存しないモデルを簡単に作成して共有することができます。Cifar-10 分類用のシステムを作成しましょう。

```
class LitModel(pl.LightningModule):
    def __init__(self, input_shape, num_classes, learning_rate=2e-4):
        super().__init__()
        
        # ハイパーパラメーターをログ
        self.save_hyperparameters()
        self.learning_rate = learning_rate
        
        self.conv1 = nn.Conv2d(3, 32, 3, 1)
        self.conv2 = nn.Conv2d(32, 32, 3, 1)
        self.conv3 = nn.Conv2d(32, 64, 3, 1)
        self.conv4 = nn.Conv2d(64, 64, 3, 1)

        self.pool1 = torch.nn.MaxPool2d(2)
        self.pool2 = torch.nn.MaxPool2d(2)
        
        n_sizes = self._get_conv_output(input_shape)

        self.fc1 = nn.Linear(n_sizes, 512)
        self.fc2 = nn.Linear(512, 128)
        self.fc3 = nn.Linear(128, num_classes)

        self.accuracy = Accuracy(task='multiclass', num_classes=num_classes)

    # 畳み込みブロックから線形層に入る出力テンソルのサイズを返します。
    def _get_conv_output(self, shape):
        batch_size = 1
        input = torch.autograd.Variable(torch.rand(batch_size, *shape))

        output_feat = self._forward_features(input) 
        n_size = output_feat.data.view(batch_size, -1).size(1)
        return n_size
        
    # 畳み込みブロックからの特徴テンソルを返します。
    def _forward_features(self, x):
        x = F.relu(self.conv1(x))
        x = self.pool1(F.relu(self.conv2(x)))
        x = F.relu(self.conv3(x))
        x = self.pool2(F.relu(self.conv4(x)))
        return x
    
    # 推論中に使用されます。
    def forward(self, x):
       x = self._forward_features(x)
       x = x.view(x.size(0), -1)
       x = F.relu(self.fc1(x))
       x = F.relu(self.fc2(x))
       x = F.log_softmax(self.fc3(x), dim=1)
       
       return x
    
    def training_step(self, batch, batch_idx):
        x, y = batch
        logits = self(x)
        loss = F.nll_loss(logits, y)
        
        # トレーニングのメトリクス
        preds = torch.argmax(logits, dim=1)
        acc = self.accuracy(preds, y)
        self.log('train_loss', loss, on_step=True, on_epoch=True, logger=True)
        self.log('train_acc', acc, on_step=True, on_epoch=True, logger=True)
        
        return loss
    
    def validation_step(self, batch, batch_idx):
        x, y = batch
        logits = self(x)
        loss = F.nll_loss(logits, y)

        # 検証のメトリクス
        preds = torch.argmax(logits, dim=1)
        acc = self.accuracy(preds, y)
        self.log('val_loss', loss, prog_bar=True)
        self.log('val_acc', acc, prog_bar=True)
        return loss
    
    def test_step(self, batch, batch_idx):
        x, y = batch
        logits = self(x)
        loss = F.nll_loss(logits, y)
        
        # 検証のメトリクス
        preds = torch.argmax(logits, dim=1)
        acc = self.accuracy(preds, y)
        self.log('test_loss', loss, prog_bar=True)
        self.log('test_acc', acc, prog_bar=True)
        return loss
    
    def configure_optimizers(self):
        optimizer = torch.optim.Adam(self.parameters(), lr=self.learning_rate)
        return optimizer

```

## トレーニングと評価

`DataModule` を使用してデータパイプラインを整理し、`LightningModule` を使用してモデルアーキテクチャーやトレーニングループを整理したので、PyTorch Lightning の `Trainer` が残りのすべてを自動化してくれます。

Trainer は次を自動化します：
- エポックとバッチの反復
- `optimizer.step()`, `backward`, `zero_grad()` の呼び出し
- `.eval()` の呼び出し、グラッドの有効化/無効化
- 重みの保存と読み込み
- Weights and Biases ログ
- マルチ GPU トレーニングサポート
- TPU サポート
- 16 ビット トレーニングサポート

```
dm = CIFAR10DataModule(batch_size=32)
# x_dataloader アクセスには prepare_data と setup を呼び出す必要があります。
dm.prepare_data()
dm.setup()

# 画像予測をログに記録するためにカスタム ImagePredictionLogger コールバックが必要とするサンプル
val_samples = next(iter(dm.val_dataloader()))
val_imgs, val_labels = val_samples[0], val_samples[1]
val_imgs.shape, val_labels.shape
```

```
model = LitModel((3, 32, 32), dm.num_classes)

# wandb ロガーの初期化
wandb_logger = WandbLogger(project='wandb-lightning', job_type='train')

# コールバックの初期化
early_stop_callback = pl.callbacks.EarlyStopping(monitor="val_loss")
checkpoint_callback = pl.callbacks.ModelCheckpoint()

# トレーナーの初期化
trainer = pl.Trainer(max_epochs=2,
                     logger=wandb_logger,
                     callbacks=[early_stop_callback,
                                ImagePredictionLogger(val_samples),
                                checkpoint_callback],
                     )

# モデルのトレーニング
trainer.fit(model, dm)

# 保留されたテストセットでモデルを評価 ⚡⚡
trainer.test(dataloaders=dm.test_dataloader())

# wandb run を閉じる
wandb.finish()
```

## 最後に
私は TensorFlow/Keras エコシステム出身でありながら、PyTorch が非常に洗練されたフレームワークにもかかわらず、少々圧倒されていました。個人的な経験ではありますが、PyTorch Lightning を探ったとき、私が PyTorch を避けていた理由がほぼすべて解消されていることに気付きました。ここでの私の興奮をまとめてみます：
- 以前は：従来の PyTorch モデル定義はあちこちに散らばっていました。モデルが `model.py` スクリプトにあり、トレーニングループが `train.py` ファイルにあることが多く、そのパイプラインを理解するためには前後を行き来することが多かったです。
- 現在は：`LightningModule` がシステムとして機能し、モデルが `training_step`、`validation_step` などと一緒に定義されているので、今やモジュラーで共有可能です。
- 以前は：TensorFlow/Keras の良いところは入力データパイプラインでした。そこのデータセットカタログは豊富で成長し続けています。PyTorch のデータパイプラインは最大の痛みのポイントだったのです。普通の PyTorch コードだとデータのダウンロード/クリーンアップ/準備は通常多くのファイルに分散しています。
- 現在は：DataModuleはデータパイプラインを共有可能で再利用可能なクラスに整理します。それは単に `train_dataloader`、 `val_dataloader`(s)、 `test_dataloader`(s) と、必要な変換およびデータ処理/ダウンロード手順を含むものです。
- 以前は：Keras では、`model.fit` を呼び出してモデルをトレーニングし、`model.predict` を用いて推論を行い、`model.evaluate` を使用してテストデータで従来型のシンプルな評価を提供します。これは PyTorch では当てはまりません。通常 `train.py` と `test.py` ファイルが分かれています。
- 現在は：`LightningModule` があるので、`Trainer` が全て自動化してくれます。単に `trainer.fit` と `trainer.test` を呼び出して、モデルのトレーニングと評価を行う必要があります。
- 以前は： TensorFlow は TPU を愛し、PyTorch は…
- 現在は：PyTorch Lightning を使用すれば同じモデルを複数の GPU や TPU でも簡単にトレーニングできます。
- 以前は：コールバックの大ファンであり、カスタムコールバックを書くのが好きです。Early Stopping のような些細なことも従来の PyTorch では話題になることがあります。
- 現在は：PyTorch Lightning で Early Stopping や Model Checkpointing を使用するのは簡単です。カスタムコールバックを書くこともできます。

## 🎨 結論とリソース

このレポートが役に立つことを願っています。コードを試して、あなたが選んだデータセットで画像分類器を訓練してみることをお勧めします。

PyTorch Lightning についてもっと知るためのいくつかのリソースを以下に示します：
- [Step-by-step walk-through](https://lightning.ai/docs/pytorch/latest/starter/introduction.html) - これは公式チュートリアルの1つです。ドキュメンテーションは非常に良く書かれており、素晴らしい学習リソースとして強くお勧めします。
- [Use Pytorch Lightning with Weights & Biases](https://wandb.me/lightning) - W&B と PyTorch Lightning の使い方を学ぶために実行できる、簡単な colab です。