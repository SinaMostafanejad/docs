/**
 * Creating a sidebar enables you to:
 - create an ordered group of docs
 - render a sidebar for each doc of that group
 - provide next/previous navigation

 The sidebars can be generated from the filesystem, or explicitly defined here.

 Create as many sidebars as you want.
 */

// @ts-check

/** @type {import('@docusaurus/plugin-content-docs').SidebarsConfig} */
const sidebars = {
  default: [
    'guides/intro',
    'quickstart',
    {
      type: 'category',
      label: '実験管理',
      link: { type: 'doc', id: 'guides/track/intro' },
      items: [
        'guides/track/launch',
        'guides/track/config',
        {
          type: 'category',
          label: 'Runとは',
          link: { type: 'doc', id: 'guides/runs/intro' },
          items: [
            'guides/runs/grouping',
            'guides/runs/resuming',
            'guides/runs/alert',
            'guides/runs/manage-runs',
          ],
        },
        {
          type: 'category',
          label: 'メディアとオブジェクトのログ',
          link: { type: 'doc', id: 'guides/track/log/intro' },
          items: [
            'guides/track/log/plots',
            'guides/track/log/log-tables',
            'guides/track/log/log-summary',
            'guides/track/log/media',
            'guides/track/log/working-with-csv',
            'guides/track/log/distributed-training',
            'guides/track/log/customize-logging-axes',
            'guides/track/log/logging-faqs',
          ],
        },
        'guides/track/app',
        'guides/track/jupyter',
        'guides/track/limits',
        'guides/track/public-api-guide',
        'guides/track/tracking-faq',
        'guides/track/environment-variables',
      ],
    },
    {
      type: 'category',
      label: 'レポート',
      link: { type: 'doc', id: 'guides/reports/intro' },
      items: [
        'guides/reports/create-a-report',
        'guides/reports/edit-a-report',
        'guides/reports/collaborate-on-reports',
        'guides/reports/clone-and-export-reports',
        'guides/reports/embed-reports',
        'guides/reports/cross-project-reports',
        'guides/reports/reports-gallery',
        'guides/reports/reports-faq',
      ],
    },
    {
      type: 'category',
      label: 'アーティファクト',
      link: { type: 'doc', id: 'guides/artifacts/intro' },
      items: [
        'guides/artifacts/artifacts-walkthrough',
        'guides/artifacts/construct-an-artifact',
        'guides/artifacts/download-and-use-an-artifact',
        'guides/artifacts/update-an-artifact',
        'guides/artifacts/create-a-custom-alias',
        'guides/artifacts/create-a-new-artifact-version',
        'guides/artifacts/track-external-files',
        'guides/artifacts/delete-artifacts',
        'guides/artifacts/explore-and-traverse-an-artifact-graph',
        'guides/artifacts/storage',
        'guides/artifacts/data-privacy-and-compliance',
        'guides/artifacts/artifacts-faqs',
      ],
    },
    {
      type: 'category',
      label: 'テーブル',
      link: { type: 'doc', id: 'guides/tables/intro' },
      items: [
        'guides/tables/tables-walkthrough',
        'guides/tables/visualize-tables',
        'guides/tables/tables-gallery',
      ],
    },
    {
      type: 'category',
      label: 'スイープ',
      link: { type: 'doc', id: 'guides/sweeps/intro' },
      items: [
        'guides/sweeps/walkthrough',
        'guides/sweeps/add-w-and-b-to-your-code',
        'guides/sweeps/define-sweep-configuration',
        'guides/sweeps/initialize-sweeps',
        'guides/sweeps/start-sweep-agents',
        'guides/sweeps/parallelize-agents',
        'guides/sweeps/visualize-sweep-results',
        'guides/sweeps/pause-resume-and-cancel-sweeps',
        'guides/sweeps/sweeps-ui',
        'guides/sweeps/local-controller',
        'guides/sweeps/troubleshoot-sweeps',
        'guides/sweeps/faq',
        'guides/sweeps/useful-resources',
        'guides/sweeps/existing-project',
      ],
    },
    {
      type: 'category',
      label: 'モデル',
      link: { type: 'doc', id: 'guides/model_registry/intro' },
      items: [
        // 'guides/model_registry/quickstart',
        // 'guides/model_registry/access_controls',
        // 'guides/model_registry/automation',
        // 'guides/model_registry/notifications',
        // 'guides/model_registry/model_tags',
        'guides/model_registry/model-management-concepts',
        'guides/model_registry/walkthrough',
      ],
    },
    {
      type: 'category',
      label: 'ローンチ',
      link: {
        type: 'doc',
        id: 'guides/launch/intro',
      },
      items: [
        'guides/launch/walkthrough',
        'guides/launch/launch-terminology',
        {
          type: 'category',
          label: 'Set up Launch',
          link: {
            type: 'doc',
            id: 'guides/launch/setup-launch',
          },
          items: [               
            'guides/launch/setup-launch-docker',
            'guides/launch/setup-launch-sagemaker',
            'guides/launch/setup-launch-kubernetes',
            'guides/launch/setup-vertex',
            'guides/launch/setup-agent-advanced',
            'guides/launch/setup-queue-advanced',
          ],
        },
        {
          type: 'category',
          label: 'Create and deploy jobs',
          items: [
            'guides/launch/create-launch-job',
            'guides/launch/add-job-to-queue',
            'guides/launch/launch-view-jobs',
            'guides/launch/launch-queue-observability'
          ],
        },

        'guides/launch/sweeps-on-launch',
        'guides/launch/launch-faqs',
      ]
    },   
    {
      type: 'category',
      label: 'プロンプト',
      link: {
        type: 'doc',
        id: 'guides/prompts/intro',
      },
      items: [
        'guides/prompts/quickstart',
      ],
    },
    {
      type: 'category',
      label: 'Appリファレンス',
      link: { type: 'doc', id: 'guides/app/intro' },
      items: [
        {
          type: 'category',
          label: '機能',
          link: { type: 'doc', id: 'guides/app/features/intro' },
          items: [
            {
              type: 'category',
              label: 'Panels',
              link: { type: 'doc', id: 'guides/app/features/panels/intro' },
              items: [
                {
                  type: 'category',
                  label: 'Line Plot',
                  link: {
                    type: 'doc',
                    id: 'guides/app/features/panels/line-plot/intro',
                  },
                  items: [
                    'guides/app/features/panels/line-plot/reference',
                    'guides/app/features/panels/line-plot/sampling',
                    'guides/app/features/panels/line-plot/smoothing',
                  ],
                },
                'guides/app/features/panels/bar-plot',
                'guides/app/features/panels/run-colors',
                'guides/app/features/panels/parallel-coordinates',
                'guides/app/features/panels/scatter-plot',
                'guides/app/features/panels/code',
                'guides/app/features/panels/parameter-importance',
                'guides/app/features/panels/run-comparer',
                {
                  type: 'category',
                  label: 'Weave',
                  link: {
                    type: 'doc',
                    id: 'guides/app/features/panels/weave/intro',
                  },
                  items: [
                    'guides/app/features/panels/weave/embedding-projector',
                  ],
                },
              ],
            },
            {
              type: 'category',
              label: 'Custom Charts',
              link: {
                type: 'doc',
                id: 'guides/app/features/custom-charts/intro',
              },
              items: [
                'guides/app/features/custom-charts/walkthrough',
              ],
            },
            'guides/app/features/runs-table',
            'guides/app/features/tags',
            'guides/app/features/notes',
            'guides/app/features/teams',
            'guides/app/features/system-metrics',
            'guides/app/features/anon',
          ],
        },
        {
          type: 'category',
          label: 'ページ',
          link: { type: 'doc', id: 'guides/app/pages/intro' },
          items: [
            'guides/app/pages/gradient-panel',
            'guides/app/pages/project-page',
            'guides/app/pages/run-page',
            'guides/app/pages/workspaces',
          ],
        },
        {
          type: 'category',
          label: '設定',
          link: { type: 'doc', id: 'guides/app/settings-page/intro' },
          items: [
            'guides/app/settings-page/user-settings',
            'guides/app/settings-page/team-settings',
            'guides/app/settings-page/emails',
          ],
        },
      ],
    },
    {
      type: 'category',
      label: 'W&Bサーバー',
      link: { type: 'doc', id: 'guides/hosting/intro' },
      items: [
        {
          type: 'category',
          label: 'ホスティングオプション',
          link: { type: 'doc', id: 'guides/hosting/hosting-options/intro' },
          items: [
            'guides/hosting/hosting-options/wb-managed',
            'guides/hosting/hosting-options/self-managed',
          ],
        },
        'guides/hosting/secure-storage-connector',
        'guides/hosting/sso',
        'guides/hosting/ldap',
        'guides/hosting/audit-logging',
        'guides/hosting/manage-users',
        'guides/hosting/prometheus-logging',
        'guides/hosting/slack-alerts',
        'guides/hosting/smtp',
        'guides/hosting/env-vars',
        {
          type: 'category',
          label: 'ハウツーガイド',
          // link: {type: 'doc', id: 'guides/hosting/how-to-guides/intro'},
          items: [
            'guides/hosting/how-to-guides/basic-setup',
            'guides/hosting/how-to-guides/aws-tf',
            'guides/hosting/how-to-guides/gcp-tf',
            'guides/hosting/how-to-guides/bare-metal',
          ],
        },
      ],
    },
    {
      type: 'category',
      label: 'インテグレーション',
      link: { type: 'doc', id: 'guides/integrations/intro' },
      items: [
        'guides/integrations/add-wandb-to-any-library',
        'guides/integrations/other/catalyst',
        'guides/integrations/dagster',
        'guides/integrations/other/databricks',
        'guides/integrations/other/deepchecks',
        'guides/integrations/other/deepchem',
        'guides/integrations/other/docker',
        {
          type: 'category',
          label: 'Fastai',
          link: { type: 'doc', id: 'guides/integrations/fastai/README' },
          items: [
            'guides/integrations/fastai/v1',
          ],
        },
        'guides/integrations/huggingface',
        'guides/integrations/other/accelerate',
        'guides/integrations/other/hydra',
        'guides/integrations/keras',
        'guides/integrations/other/kubeflow-pipelines-kfp',
        'guides/integrations/langchain',
        'guides/integrations/lightgbm',
        'guides/integrations/other/metaflow',
        'guides/integrations/other/mmf',
        'guides/integrations/other/composer',
        'guides/integrations/other/openai-api',
        'guides/integrations/other/openai-fine-tuning',
        'guides/integrations/other/openai-gym',
        'guides/integrations/other/paddledetection',
        'guides/integrations/other/paddleocr',
        'guides/integrations/other/prodigy',
        'guides/integrations/pytorch',
        'guides/integrations/pytorch-geometric',
        'guides/integrations/other/ignite',
        'guides/integrations/lightning',
        'guides/integrations/other/ray-tune',
        'guides/integrations/other/sagemaker',
        'guides/integrations/scikit',
        'guides/integrations/other/simpletransformers',
        'guides/integrations/other/skorch',
        'guides/integrations/spacy',
        'guides/integrations/other/stable-baselines-3',
        'guides/integrations/tensorboard',
        'guides/integrations/tensorflow',
        'guides/integrations/other/w-and-b-for-julia',
        'guides/integrations/xgboost',
        'guides/integrations/yolov5',
        'guides/integrations/other/yolox',
      ],
    },
    {
      type: 'category',
      label: '技術FAQ',
      link: { type: 'doc', id: 'guides/technical-faq/intro' },
      items: [
        'guides/technical-faq/general',
        'guides/technical-faq/metrics-and-performance',
        'guides/technical-faq/setup',
        'guides/technical-faq/troubleshooting',
      ],
    },
  ],
  ref: [
    {
      type: 'autogenerated',
      dirName: 'ref',
    },
  ],  
  tutorials: [
    {
      type: 'doc',
      id: 'tutorials/intro_to_tutorials', // document ID
      label: 'W&B Tutorials', // sidebar label
    },
    // 'guides/tutorials/intro_to_tutorials',
    'tutorials/experiments',
    'tutorials/tables',
    'tutorials/sweeps',
    'tutorials/artifacts',
    'tutorials/models',
    {
      type: 'category',
      label: 'Integration Tutorials',
      // link: {type: 'doc', id: 'guides/hosting/how-to-guides/intro'},
      items: [
        'tutorials/pytorch',
        'tutorials/lightning',
        'tutorials/huggingface',
        'tutorials/tensorflow',
        'tutorials/tensorflow_sweeps',
        'tutorials/keras',
        'tutorials/keras_tables',
        'tutorials/keras_models',
        'tutorials/xgboost',
        'tutorials/xgboost_sweeps',
        'tutorials/lightgbm',

      ],
    },
    {
      type: 'category',
      label: 'Launch Tutorials',
      // link: {type: 'doc', id: 'guides/hosting/how-to-guides/intro'},
      items: [
        'tutorials/volcano',
      ],
    },
  ],

};

module.exports = sidebars;
