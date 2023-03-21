import fs from 'fs';
import _ from 'lodash';

export type Redirect = {
  from: string;
  to: string;

  // This is the same `exact` prop used by `react-router`. When `exact !== true`,
  // the redirect will be applied to all paths that start with `from`.
  exact?: boolean;
};

type Segments = string[];

export function convert(redirects: Redirect[]): Redirect[] {
  const {withoutAbsolute, withAbsolute} = groupRedirectsByAbsolute(redirects);

  const fromPaths: Segments[] = [];
  for (const {from} of withoutAbsolute) {
    const fromSegments = from.split('/');
    fromPaths.push(fromSegments);
  }

  const results = getResults(fromPaths);
  // console.log(JSON.stringify(results, null, 2));

  const inexactRedirects: Redirect[] = [];
  const inexactIndices = new Set<number>();
  for (const {prefix, matches} of results) {
    const filteredMatches = matches.filter(({index, suffix}) =>
      withoutAbsolute[index]!.to.endsWith(suffix)
    );

    if (filteredMatches.length < 2) {
      continue;
    }

    const newPrefixes = filteredMatches.map(({index, suffix}) => {
      if (suffix === ``) {
        return withoutAbsolute[index]!.to;
      }
      return withoutAbsolute[index]!.to.slice(0, -suffix.length);
    });

    const uniqueNewPrefixes = _.uniq(newPrefixes);

    if (uniqueNewPrefixes.length === 1) {
      inexactRedirects.push({
        from: prefix,
        to: uniqueNewPrefixes[0]!,
      });
      for (const {index} of filteredMatches) {
        inexactIndices.add(index);
      }
    }
  }

  const exactRedirects = withoutAbsolute.filter(
    (r, i) => !inexactIndices.has(i)
  );

  // log(sortExactRedirects(addExactProp([...exactRedirects, ...withAbsolute])));
  // log(sortInexactRedirects(mergeInexactRedirects(inexactRedirects)));

  return [
    ...sortExactRedirects(addExactProp([...exactRedirects, ...withAbsolute])),
    ...sortInexactRedirects(mergeInexactRedirects(inexactRedirects)),
  ];
}

export function convertNew(redirects: Redirect[]): Redirect[] {
  const {withoutAbsolute, withAbsolute} = groupRedirectsByAbsolute(redirects);

  const inexactRedirectsWithIndices =
    getInexactRedirectsWithIndices(withoutAbsolute);
  // log(inexactRedirectsWithIndices);
  const inexactRedirects: Redirect[] = [];
  const inexactIndices = new Set<number>();
  for (const {redirect, indices} of inexactRedirectsWithIndices) {
    inexactRedirects.push(redirect);
    for (const index of indices) {
      inexactIndices.add(index);
    }
  }

  const exactRedirects = withoutAbsolute.filter(
    (r, i) => !inexactIndices.has(i)
  );

  // log(sortExactRedirects(addExactProp([...exactRedirects, ...withAbsolute])));
  // log(sortInexactRedirects(mergeInexactRedirects(inexactRedirects)));

  return [
    ...sortExactRedirects(addExactProp([...exactRedirects, ...withAbsolute])),
    ...sortInexactRedirects(mergeInexactRedirects(inexactRedirects)),
  ];
}

function log(x: any): void {
  console.log(JSON.stringify(x, null, 2));
}

function mergeInexactRedirects(redirects: Redirect[]): Redirect[] {
  for (const redirect of redirects) {
    if (redirect.exact) {
      throw new Error(`mergeInexactRedirects called on exact redirect`);
    }
  }
  return redirects;
}

function sortExactRedirects(redirects: Redirect[]): Redirect[] {
  return _.sortBy(redirects, r => r.from);
}

function sortInexactRedirects(redirects: Redirect[]): Redirect[] {
  return _.sortBy(
    _.sortBy(redirects, r => r.from),

    // Longer paths should take precedence over shorter paths
    r => -r.from.split('/').length
  );
}

function addExactProp(redirects: Redirect[]): Redirect[] {
  return redirects.map(r => ({...r, exact: true}));
}

type RedirectData = {
  fromPrefix: string;
  toPrefix: string;
  suffix: string;
  index: number;
};

type RedirectWithIndices = {
  redirect: Redirect;
  indices: number[];
};

function getInexactRedirectsWithIndices(
  redirects: Redirect[]
): RedirectWithIndices[] {
  const inexactRedirects: RedirectWithIndices[] = [];
  const handledIndices = new Set<number>();
  const maxFromSegmentCount = getMaxFromSegmentCount(redirects);
  for (
    let fromSegmentCount = 1;
    fromSegmentCount < maxFromSegmentCount;
    fromSegmentCount++
  ) {
    const datas: RedirectData[] = redirects
      .map(getRedirectData)
      .filter(isNotNullOrUndefined);

    Object.values(_.groupBy(datas, d => d.fromPrefix))
      .filter(moreThanOneRedirect)
      .filter(allToPrefixesEqual)
      .forEach(datas => {
        inexactRedirects.push({
          redirect: {
            from: datas[0]!.fromPrefix,
            to: datas[0]!.toPrefix,
          },
          indices: datas.map(d => d.index),
        });
        for (const {index} of datas) {
          handledIndices.add(index);
        }
      });

    function getRedirectData(r: Redirect, i: number): RedirectData | null {
      if (handledIndices.has(i)) {
        return null;
      }
      const fromPrefix = truncateToNSegments(r.from, fromSegmentCount);
      const fromSuffix = r.from.slice(fromPrefix.length);
      if (!r.to.endsWith(fromSuffix)) {
        // Exclude redirects where from and to have different suffixes
        return null;
      }
      const toPrefix = r.to.slice(0, r.to.length - fromSuffix.length);
      return {
        fromPrefix,
        toPrefix,
        suffix: fromSuffix,
        index: i,
      };
    }

    function moreThanOneRedirect(datas: RedirectData[]): boolean {
      return datas.length > 1;
    }
    function allToPrefixesEqual(datas: RedirectData[]): boolean {
      return datas.every(({toPrefix}) => toPrefix === datas[0]!.toPrefix);
    }
  }

  return inexactRedirects;
}

function getSegmentsFromPath(path: string): string[] {
  return killLeadingSlash(path).split('/');
}

function getMaxFromSegmentCount(redirects: Redirect[]): number {
  const fromSegmentCounts = redirects.map(
    r => getSegmentsFromPath(r.from).length
  );
  return Math.max(...fromSegmentCounts);
}

function truncateToNSegments(path: string, n: number): string {
  const segments = getSegmentsFromPath(path);
  return `/${segments.slice(0, n).join('/')}`;
}

function killLeadingSlash(path: string): string {
  if (path.startsWith(`/`)) {
    return path.slice(1);
  }
  return path;
}

function isNotNullOrUndefined<T>(x: T | null | undefined): x is T {
  return x != null;
}

type Result = {
  prefix: string;
  matches: Array<{index: number; suffix: string}>;
};

function getResults(paths: Segments[]): Result[] {
  let maxLength = getMaxSegmentLength(paths);

  const alreadyHandledIndices = new Set<number>();
  const res: Result[] = [];

  // We want to ignore the empty string preceding the first slash
  // So we stop at 1 instead of 0
  for (let currentLength = maxLength; currentLength > 1; currentLength--) {
    const truncatedPaths = paths.map(p => truncateSegments(p, currentLength));

    const indicesByDuplicatePrefix = new Map<string, number[]>();
    for (let i = 0; i < truncatedPaths.length; i++) {
      const path = truncatedPaths[i];
      if (path!.length !== currentLength || alreadyHandledIndices.has(i)) {
        continue;
      }
      const pathStr = path!.join('/');
      if (indicesByDuplicatePrefix.has(pathStr)) {
        indicesByDuplicatePrefix.get(pathStr)!.push(i);
      } else {
        indicesByDuplicatePrefix.set(pathStr, [i]);
      }
    }

    indicesByDuplicatePrefix.forEach((indices, pathStr) => {
      if (indices.length < 2) {
        return;
      }

      for (const index of indices) {
        alreadyHandledIndices.add(index);
      }

      res.push({
        prefix: pathStr,
        matches: indices.map(index => {
          const suffixWithoutSlash =
            paths[index]!.slice(currentLength).join('/');
          return {
            index,
            suffix:
              suffixWithoutSlash === ``
                ? suffixWithoutSlash
                : `/${suffixWithoutSlash}`,
          };
        }),
      });

      // console.log(`DUPLICATE: ${pathStr}`);
      // console.log(`PATHS:`);
      // for (const index of indices) {
      //   console.log(`  ${paths[index].join('/')}`);
      // }
      // console.log();
    });
  }

  return res;
}

function truncateSegments(segments: Segments, n: number): Segments {
  return segments.slice(0, n);
}

function getMaxSegmentLength(paths: Segments[]): number {
  let max = 0;
  for (const path of paths) {
    max = Math.max(max, path.length);
  }
  return max;
}

function groupRedirectsByAbsolute(redirects: Redirect[]): {
  withAbsolute: Redirect[];
  withoutAbsolute: Redirect[];
} {
  const withAbsolute: Redirect[] = [];
  const withoutAbsolute: Redirect[] = [];
  for (const redirect of redirects) {
    if (redirect.from.startsWith(`http`) || redirect.to.startsWith(`http`)) {
      withAbsolute.push(redirect);
    } else {
      withoutAbsolute.push(redirect);
    }
  }
  return {withAbsolute, withoutAbsolute};
}

const redirects: Redirect[] = [
  {
    from: '/app',
    to: '/guides/app',
  },
  {
    from: '/app/features/custom-charts',
    to: '/guides/app/features/custom-charts',
  },
  {
    from: '/app/features/sidebar',
    to: '/guides/app/features/runs-table#add-sidebar-columns',
  },
  {
    from: '/artifacts',
    to: '/guides/artifacts',
  },
  {
    from: '/company',
    to: 'https://wandb.ai/site/company',
  },
  {
    from: '/company/academics',
    to: 'https://wandb.ai/site/research',
  },
  {
    from: '/company/data-and-privacy',
    to: 'https://security.wandb.ai',
  },
  {
    from: '/data-vis/log-tables',
    to: '/guides/track/log/log-tables',
  },
  {
    from: '/datasets-and-predictions',
    to: '/guides/integrations/mmdetection#visualize-dataset-and-model-prediction',
  },
  {
    from: '/docs/config.html',
    to: '/ref/weave/run#run-config',
  },
  {
    from: '/docs/frameworks/fastai.html',
    to: '/guides/integrations/fastai',
  },
  {
    from: '/docs/init.html',
    to: '/ref/python/init',
  },
  {
    from: '/docs/integrations/api.html',
    to: '/ref/python/public-api/api',
  },
  {
    from: '/docs/started.html',
    to: '/quickstart',
  },
  {
    from: '/docs/sweep.html',
    to: '/guides/sweeps',
  },
  {
    from: '/examples',
    to: '/guides/integrations',
  },
  {
    from: '/getting-started',
    to: '/quickstart',
  },
  {
    from: '/guides',
    to: '/',
  },
  {
    from: '/guides/app//settings-page/team-settings',
    to: '/guides/app/settings-page/team-settings',
  },
  {
    from: '/guides/artifacts/api',
    to: '/ref/python/public-api/artifact',
  },
  {
    from: '/guides/artifacts/artifacts-core-concepts',
    to: '/guides/artifacts',
  },
  {
    from: '/guides/artifacts/dataset-versioning',
    to: '/guides/data-and-model-versioning/dataset-versioning',
  },
  {
    from: '/guides/artifacts/model-versioning',
    to: '/guides/data-and-model-versioning/model-versioning',
  },
  {
    from: '/guides/artifacts/references',
    to: '/guides/artifacts',
  },
  {
    from: '/guides/data-vis/log-tables',
    to: '/guides/track/log/log-tables',
  },
  {
    from: '/guides/integrat',
    to: '/guides/integrations',
  },
  {
    from: '/guides/integrations/boosting',
    to: '/guides/integrations',
  },
  {
    from: '/guides/integrations/kubeflow',
    to: '/guides/integrations/kubeflow-pipelines-kfp',
  },
  {
    from: '/guides/integrations/other/add-wandb-to-any-library',
    to: '/guides/integrations/add-wandb-to-any-library',
  },
  {
    from: '/guides/integrations/other/catalyst',
    to: '/guides/integrations/catalyst',
  },
  {
    from: '/guides/integrations/other/composer',
    to: '/guides/integrations/composer',
  },
  {
    from: '/guides/integrations/other/dagster',
    to: '/guides/integrations/dagster',
  },
  {
    from: '/guides/integrations/other/databricks',
    to: '/guides/integrations/databricks',
  },
  {
    from: '/guides/integrations/other/deepchecks',
    to: '/guides/integrations/deepchecks',
  },
  {
    from: '/guides/integrations/other/deepchem',
    to: '/guides/integrations/deepchem',
  },
  {
    from: '/guides/integrations/other/docker',
    to: '/guides/integrations/docker',
  },
  {
    from: '/guides/integrations/other/fastai',
    to: '/guides/integrations/fastai',
  },
  {
    from: '/guides/integrations/other/fastai/v1',
    to: '/guides/integrations/fastai/v1',
  },
  {
    from: '/guides/integrations/other/huggingface',
    to: '/guides/integrations/huggingface',
  },
  {
    from: '/guides/integrations/other/hydra',
    to: '/guides/integrations/hydra',
  },
  {
    from: '/guides/integrations/other/ignite',
    to: '/guides/integrations/ignite',
  },
  {
    from: '/guides/integrations/other/keras',
    to: '/guides/integrations/keras',
  },
  {
    from: '/guides/integrations/other/kubeflow',
    to: '/guides/integrations/kubeflow-pipelines-kfp',
  },
  {
    from: '/guides/integrations/other/kubeflow-pipelines-kfp',
    to: '/guides/integrations/kubeflow-pipelines-kfp',
  },
  {
    from: '/guides/integrations/other/lightgbm',
    to: '/guides/integrations/lightgbm',
  },
  {
    from: '/guides/integrations/other/lightning',
    to: '/guides/integrations/lightning',
  },
  {
    from: '/guides/integrations/other/metaflow',
    to: '/guides/integrations/metaflow',
  },
  {
    from: '/guides/integrations/other/mmdetection',
    to: '/guides/integrations/mmdetection',
  },
  {
    from: '/guides/integrations/other/mmf',
    to: '/guides/integrations/mmf',
  },
  {
    from: '/guides/integrations/other/openai',
    to: '/guides/integrations/openai',
  },
  {
    from: '/guides/integrations/other/openai-gym',
    to: '/guides/integrations/openai-gym',
  },
  {
    from: '/guides/integrations/other/paddledetection',
    to: '/guides/integrations/paddledetection',
  },
  {
    from: '/guides/integrations/other/paddleocr',
    to: '/guides/integrations/paddleocr',
  },
  {
    from: '/guides/integrations/other/prodigy',
    to: '/guides/integrations/prodigy',
  },
  {
    from: '/guides/integrations/other/pytorch',
    to: '/guides/integrations/pytorch',
  },
  {
    from: '/guides/integrations/other/ray-tune',
    to: '/guides/integrations/ray-tune',
  },
  {
    from: '/guides/integrations/other/sagemaker',
    to: '/guides/integrations/sagemaker',
  },
  {
    from: '/guides/integrations/other/scikit',
    to: '/guides/integrations/scikit',
  },
  {
    from: '/guides/integrations/other/simpletransformers',
    to: '/guides/integrations/simpletransformers',
  },
  {
    from: '/guides/integrations/other/skorch',
    to: '/guides/integrations/skorch',
  },
  {
    from: '/guides/integrations/other/spacy',
    to: '/guides/integrations/spacy',
  },
  {
    from: '/guides/integrations/other/stable-baselines-3',
    to: '/guides/integrations/stable-baselines-3',
  },
  {
    from: '/guides/integrations/other/tensorboard',
    to: '/guides/integrations/tensorboard',
  },
  {
    from: '/guides/integrations/other/tensorflow',
    to: '/guides/integrations/tensorflow',
  },
  {
    from: '/guides/integrations/other/w-and-b-for-julia',
    to: '/guides/integrations/w-and-b-for-julia',
  },
  {
    from: '/guides/integrations/other/xgboost',
    to: '/guides/integrations/xgboost',
  },
  {
    from: '/guides/integrations/other/yolov5',
    to: '/guides/integrations/yolov5',
  },
  {
    from: '/guides/integrations/other/yolox',
    to: '/guides/integrations/yolox',
  },
  {
    from: '/guides/self-hosted',
    to: '/guides/hosting',
  },
  {
    from: '/guides/self-hosted/configuration',
    to: '/guides/hosting/setup/configuration',
  },
  {
    from: '/guides/self-hosted/local',
    to: '/guides/hosting/basic-setup',
  },
  {
    from: '/guides/self-hosted/local-common-questions',
    to: '/guides/hosting/faq',
  },
  {
    from: '/guides/self-hosted/setup',
    to: '/guides/hosting/setup',
  },
  {
    from: '/guides/self-hosted/setup/configuration',
    to: '/guides/hosting/setup/configuration',
  },
  {
    from: '/guides/self-hosted/setup/dedicated-cloud',
    to: '/guides/hosting/setup/dedicated-cloud',
  },
  {
    from: '/guides/self-hosted/setup/on-premise-baremetal',
    to: '/guides/hosting/setup/on-premise-baremetal',
  },
  {
    from: '/guides/self-hosted/setup/private-cloud',
    to: '/guides/hosting/setup/private-cloud',
  },
  {
    from: '/guides/sweeps/advanced-sweeps/ray-tune',
    to: '/guides/integrations/ray-tune',
  },
  {
    from: '/guides/sweeps/configuration',
    to: '/guides/sweeps/define-sweep-configuration',
  },
  {
    from: '/guides/sweeps/python-api',
    to: '/ref/python/public-api/api',
  },
  {
    from: '/guides/track/advanced/distributed-training',
    to: '/guides/track/log/distributed-training',
  },
  {
    from: '/guides/track/advanced/environment-variables',
    to: '/guides/track/environment-variables',
  },
  {
    from: '/guides/track/advanced/grouping',
    to: '/guides/runs/grouping',
  },
  {
    from: '/guides/track/advanced/resuming',
    to: '/guides/runs/resuming',
  },
  {
    from: '/guides/track/advanced/save-restore',
    to: '/guides/track/save-restore',
  },
  {
    from: '/guides/track/alert',
    to: '/guides/runs/alert',
  },
  {
    from: '/guides/track/media',
    to: '/guides/track/log/media',
  },
  {
    from: '/huggingface',
    to: '/guides/integrations/huggingface',
  },
  {
    from: '/integrations/huggingface',
    to: '/guides/integrations/huggingface',
  },
  {
    from: '/integrations/jupyter',
    to: '/guides/track/jupyter',
  },
  {
    from: '/integrations/jupyter.html',
    to: '/guides/track/jupyter',
  },
  {
    from: '/integrations/lightning',
    to: '/guides/integrations/lightning',
  },
  {
    from: '/integrations/pytorch',
    to: '/guides/integrations/pytorch',
  },
  {
    from: '/integrations/ray-tune',
    to: '/guides/integrations/ray-tune',
  },
  {
    from: '/integrations/scikit',
    to: '/guides/integrations/scikit',
  },
  {
    from: '/integrations/tensorboard',
    to: '/guides/integrations/tensorboard',
  },
  {
    from: '/library/advanced/grouping',
    to: '/guides/runs/grouping',
  },
  {
    from: '/library/advanced/limits',
    to: '/guides/track/limits',
  },
  {
    from: '/library/api',
    to: '/ref/python/public-api/api',
  },
  {
    from: '/library/api/examples',
    to: '/ref/python/public-api/api',
  },
  {
    from: '/library/cli',
    to: '/ref/cli',
  },
  {
    from: '/library/config',
    to: '/ref/weave/run#run-config',
  },
  {
    from: '/library/environment-variables',
    to: '/guides/track/environment-variables',
  },
  {
    from: '/library/example-projects',
    to: '/guides/integrations/tensorflow#examples',
  },
  {
    from: '/library/frameworks',
    to: '/guides/integrations',
  },
  {
    from: '/library/frameworks/pytorch',
    to: '/guides/integrations/pytorch',
  },
  {
    from: '/library/frameworks/pytorch/lightning',
    to: '/guides/integrations/lightning',
  },
  {
    from: '/library/grouping',
    to: '/guides/runs/grouping',
  },
  {
    from: '/library/init',
    to: '/ref/python/init',
  },
  {
    from: '/library/integrations',
    to: '/guides/integrations',
  },
  {
    from: '/library/integrations/catalyst',
    to: '/guides/integrations/catalyst',
  },
  {
    from: '/library/integrations/fastai',
    to: '/guides/integrations/fastai',
  },
  {
    from: '/library/integrations/huggingface',
    to: '/guides/integrations/huggingface',
  },
  {
    from: '/library/integrations/keras',
    to: '/guides/integrations/keras',
  },
  {
    from: '/library/integrations/lightning',
    to: '/guides/integrations/lightning',
  },
  {
    from: '/library/integrations/pytorch',
    to: '/guides/integrations/pytorch',
  },
  {
    from: '/library/integrations/ray-tune',
    to: '/guides/integrations/ray-tune',
  },
  {
    from: '/library/integrations/tensorflow',
    to: '/guides/integrations/tensorflow',
  },
  {
    from: '/library/log',
    to: '/ref/python/log',
  },
  {
    from: '/library/public-api-guide',
    to: '/ref/python/public-api/api',
  },
  {
    from: '/library/resuming',
    to: '/guides/runs/resuming',
  },
  {
    from: '/library/save',
    to: '/ref/python/public-api/run#save',
  },
  {
    from: '/library/security',
    to: 'https://security.wandb.ai',
  },
  {
    from: '/library/sweeps',
    to: '/ref/python/sweep',
  },
  {
    from: '/library/sweeps/configuration',
    to: '/ref/python/sweep',
  },
  {
    from: '/library/sweeps/python-api',
    to: '/ref/python/public-api/sweep',
  },
  {
    from: '/library/technical-faq',
    to: '/guides/hosting/faq',
  },
  {
    from: '/ref/app',
    to: '/guides/app',
  },
  {
    from: '/ref/app/feature',
    to: '/guides/app/features',
  },
  {
    from: '/ref/app/features',
    to: '/guides/app/features',
  },
  {
    from: '/ref/app/features/anon',
    to: '/guides/app/features/anon',
  },
  {
    from: '/ref/app/features/custom-charts',
    to: '/guides/app/features/custom-charts',
  },
  {
    from: '/ref/app/features/custom-charts/walkthrough',
    to: '/guides/app/features/custom-charts',
  },
  {
    from: '/ref/app/features/panels/bar-plot',
    to: '/guides/app/features/panels/bar-plot',
  },
  {
    from: '/ref/app/features/panels/code',
    to: '/guides/app/features/panels/code',
  },
  {
    from: '/ref/app/features/panels/line-plot',
    to: '/guides/app/features/panels/line-plot',
  },
  {
    from: '/ref/app/features/panels/line-plot/reference',
    to: '/guides/app/features/panels/line-plot/reference',
  },
  {
    from: '/ref/app/features/panels/line-plot/smoothing',
    to: '/guides/app/features/panels/line-plot/smoothing',
  },
  {
    from: '/ref/app/features/panels/parallel-coordinates',
    to: '/guides/app/features/panels/parallel-coordinates',
  },
  {
    from: '/ref/app/features/panels/parameter-importance',
    to: '/guides/app/features/panels/parameter-importance',
  },
  {
    from: '/ref/app/features/panels/run-comparer',
    to: '/guides/app/features/panels/run-comparer',
  },
  {
    from: '/ref/app/features/panels/weave',
    to: '/guides/app/features/panels/weave',
  },
  {
    from: '/ref/app/features/panels/weave/embedding-projector',
    to: '/guides/app/features/panels/weave/embedding-projector',
  },
  {
    from: '/ref/app/features/runs-table',
    to: '/guides/app/features/runs-table',
  },
  {
    from: '/ref/app/features/system-metrics',
    to: '/guides/app/features/system-metrics',
  },
  {
    from: '/ref/app/features/tags',
    to: '/guides/app/features/tags',
  },
  {
    from: '/ref/app/features/teams',
    to: '/guides/app/features/teams',
  },
  {
    from: '/ref/app/pages/project-page',
    to: '/guides/app/pages/project-page',
  },
  {
    from: '/ref/app/pages/run-page',
    to: '/guides/app/pages/run-page',
  },
  {
    from: '/ref/app/pages/settings-page',
    to: '/guides/app/settings-page',
  },
  {
    from: '/ref/app/pages/settings-page/emails',
    to: '/guides/app/settings-page/emails',
  },
  {
    from: '/ref/app/pages/settings-page/team-settings',
    to: '/guides/app/settings-page/team-settings',
  },
  {
    from: '/ref/app/pages/settings-page/user-settings',
    to: '/guides/app/settings-page/user-settings',
  },
  {
    from: '/ref/app/pages/workspaces',
    to: '/guides/app/pages/workspaces',
  },
  {
    from: '/ref/data-types',
    to: '/ref/python/data-types',
  },
  {
    from: '/ref/public-api',
    to: '/ref/python/public-api/api',
  },
  {
    from: '/ref/python/config',
    to: '/ref/python',
  },
  {
    from: '/reports',
    to: '/guides/reports/create-a-report',
  },
  {
    from: '/self-hosted',
    to: '/guides/hosting',
  },
  {
    from: '/self-hosted/local',
    to: '/guides/hosting/basic-setup',
  },
  {
    from: '/self-hosted/setup',
    to: '/guides/hosting/setup',
  },
  {
    from: '/sweeps',
    to: '/guides/sweeps',
  },
  {
    from: '/sweeps/configuration',
    to: '/guides/sweeps/define-sweep-configuration',
  },
  {
    from: '/sweeps/existing-project',
    to: '/guides/sweeps/existing-project',
  },
  {
    from: '/sweeps/faq',
    to: '/guides/sweeps/faq',
  },
  {
    from: '/sweeps/python-api',
    to: '/ref/python/public-api/sweep',
  },
  {
    from: '/sweeps/quickstart',
    to: '/guides/sweeps/quickstart',
  },
  {
    from: '/sweeps/ray-tune',
    to: '/guides/integrations/ray-tune',
  },
  {
    from: '/sweeps/visualize-sweep-results',
    to: '/guides/sweeps/visualize-sweep-results',
  },
  {
    from: '/wandb/config',
    to: '/ref/python/init',
  },
  {
    from: '/wandb/init',
    to: '/ref/python/init',
  },
  {
    from: '/wandb/log',
    to: '/ref/python/log',
  },
  {
    from: '/guides/app/pages/settings-page',
    to: 'guides/app/settings-page',
  },
  {
    from: '/ref/python/data_types',
    to: '/ref/python/data-types',
  },
];

const convertedRedirects = convert(redirects);
// console.log(JSON.stringify(convertedRedirects, null, 2));
console.log(`${redirects.length} --> ${convertedRedirects.length}`);

ensureProperRedirectConversion(redirects, convertedRedirects);

const convertedRedirectsNew = convertNew(redirects);
// console.log(JSON.stringify(convertedRedirects, null, 2));
console.log(`${redirects.length} --> ${convertedRedirectsNew.length}`);
fs.writeFileSync(
  `newRedirects.json`,
  JSON.stringify(convertedRedirectsNew, null, 2)
);

ensureProperRedirectConversion(redirects, convertedRedirectsNew);

export type ConversionError = MissingRedirectError | WrongRedirectError;

type MissingRedirectError = {
  type: 'missing';
  oldRedirect: Redirect;
};

type WrongRedirectError = {
  type: 'wrong';
  oldRedirect: Redirect;
  convertedRedirect: Redirect;
};

export function ensureProperRedirectConversion(
  ogRedirects: Redirect[],
  convertedRedirects: Redirect[]
): ConversionError[] {
  const errors: ConversionError[] = [];
  OuterLoop: for (const oldRedirect of ogRedirects) {
    const appliedRedirect = getAppliedRedirect(
      convertedRedirects,
      oldRedirect.from
    );
    if (appliedRedirect == null) {
      pushMissing();
      continue;
    }

    if (appliedRedirect.exact) {
      if (oldRedirect.to !== appliedRedirect.to) {
        pushWrong(appliedRedirect);
      }
      continue;
    }

    const appliedTo = `${appliedRedirect.to}${getRedirectSuffix(
      appliedRedirect.from,
      oldRedirect.from
    )}`;

    if (oldRedirect.to !== appliedTo) {
      pushWrong(appliedRedirect);
    }

    function pushMissing(): void {
      errors.push({
        type: 'missing',
        oldRedirect: oldRedirect,
      });
    }
    function pushWrong(convertedRedirect: Redirect) {
      errors.push({
        type: 'wrong',
        oldRedirect: oldRedirect,
        convertedRedirect,
      });
    }
  }

  console.log(`Checked ${ogRedirects.length} redirects`);
  return errors;
}

function getAppliedRedirect(
  redirects: Redirect[],
  path: string
): Redirect | null {
  for (const redirect of redirects) {
    if (redirect.exact && redirect.from === path) {
      return redirect;
    }
    if (!redirect.exact && isPrefix(redirect.from, path)) {
      return redirect;
    }
  }
  return null;
}

function getRedirectSuffix(prefix: string, path: string): string | null {
  if (!isPrefix(prefix, path)) {
    return null;
  }
  return path.slice(prefix.length);
}

function isPrefix(prefix: string, path: string): boolean {
  return path.startsWith(prefix);
}
