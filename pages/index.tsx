import React, { useEffect, useState } from 'react'
import styled from 'styled-components'

import { InlineForm, InlineBlocks, BlockText } from 'react-tinacms-inline'

import { DefaultSeo } from 'next-seo'
import { BlockTemplate, useCMS } from 'tinacms'
import { DynamicLink } from '../components/ui/DynamicLink'
import {
  Layout,
  Hero,
  Wrapper,
  Section,
  RichTextWrapper,
} from '../components/layout'

import { Button, Video, ArrowList, ActionableModal } from '../components/ui'
import {
  InlineTextareaField,
  BlockTextArea,
  InlineControls,
  EditToggle,
  DiscardButton,
  BlocksControls,
} from '../components/ui/inline'

import { useLocalGithubJsonForm } from '../utils/github/useLocalGithubJsonForm'
import getJsonData from '../utils/github/getJsonData'
import { getGithubDataFromPreviewProps } from '../utils/github/sourceProviderConnection'
import { setIsEditMode } from '../utils'
import { enterEditMode } from '../open-authoring/authFlow'
import ContentNotFoundError from '../utils/github/ContentNotFoundError'

const HomePage = (props: any) => {
  // Sets sidebar.hidden based on preview props
  setIsEditMode(props.editMode)

  const [formData, form] = useLocalGithubJsonForm(
    props.home,
    {
      label: 'Home Page',
      fields: [
        {
          label: 'Headline',
          name: 'headline',
          description: 'Enter the main headline here',
          component: 'text',
        },
        {
          label: 'Description',
          name: 'description',
          description: 'Enter supporting main description',
          component: 'textarea',
        },
        {
          label: 'Selling Points',
          name: 'three_points',
          description: 'Edit the points here',
          component: 'group-list',
          //@ts-ignore
          itemProps: item => ({
            key: item.id,
            label: `${safeSlice(item.main, 0, 15)}...`,
          }),
          defaultItem: () => ({
            main: 'New Point',
            supporting: '',
            _template: 'selling_point',
          }),
          fields: [
            {
              label: 'Main',
              name: 'main',
              component: 'textarea',
            },
            {
              label: 'Supporting',
              name: 'supporting',
              component: 'textarea',
            },
          ],
        },
        {
          label: 'Setup Headline',
          name: 'setup.headline',
          description: 'Enter the "setup" headline here',
          component: 'textarea',
        },
        {
          label: 'Setup Steps',
          name: 'setup.steps',
          description: 'Edit the steps here',
          component: 'group-list',
          //@ts-ignore
          itemProps: item => ({
            key: item.id,
            label: `${safeSlice(item.step, 0, 15)}...`,
          }),
          defaultItem: () => ({
            step: 'New Step',
            _template: 'setup_point',
          }),
          fields: [
            {
              label: 'Step',
              name: 'step',
              component: 'textarea',
            },
          ],
        },
      ],
    },
    props.sourceProviderConnection,
    props.editMode
  )

  const [authPopupDisplayed, setAuthPopupDisplayed] = useState(false)

  const refreshPage = () => {
    fetch(`/api/reset-preview`).then(() => {
      window.location.href = '/?autoAuth'
    })
  }

  const cancelAuth = () => {
    window.history.replaceState(
      {},
      document.title,
      window.location.href.split('?')[0] //TODO - remove only autoAuth param
    )
    setAuthPopupDisplayed(false)
  }

  useEffect(() => {
    if (window.location.href.includes('autoAuth')) {
      setAuthPopupDisplayed(true)
    }
  }, [])

  return (
    <InlineForm
      form={form}
      initialStatus={props.editMode ? 'active' : 'inactive'}
    >
      {authPopupDisplayed && (
        <ActionableModal
          title="Authentication"
          message="To edit this site, you first need to be authenticated."
          actions={[
            {
              name: 'Continue',
              action: enterEditMode,
            },
            {
              name: 'Cancel',
              action: cancelAuth,
            },
          ]}
        />
      )}
      {props.previewError && (
        <ActionableModal
          title="Error"
          message={props.previewError}
          actions={[
            {
              name: 'Continue',
              action: refreshPage,
            },
          ]}
        />
      )}

      <InlineControls>
        {props.editMode && <EditToggle />}
        <DiscardButton />
      </InlineControls>
      <Layout pathname="/">
        <DefaultSeo titleTemplate={formData.title + ' | %s'} />
        <Hero overlap narrow>
          <InlineTextareaField name="headline" />
        </Hero>
        <Video src={formData.hero_video} />

        <Section>
          <Wrapper>
            <RichTextWrapper>
              <CtaLayout>
                <h2>
                  <em>
                    <InlineTextareaField name="description" />
                  </em>
                </h2>
                <CtaBar>
                  <DynamicLink
                    href={'/docs/getting-started/introduction/'}
                    passHref
                  >
                    <Button as="a" color="primary">
                      Get Started
                    </Button>
                  </DynamicLink>
                </CtaBar>
              </CtaLayout>
              <InfoLayout>
                <InlineBlocks
                  name="three_points"
                  blocks={SELLING_POINTS_BLOCKS}
                />
              </InfoLayout>
            </RichTextWrapper>
          </Wrapper>
        </Section>

        <Section color="seafoam">
          <Wrapper>
            <SetupLayout>
              <RichTextWrapper>
                <h2 className="h1">
                  <InlineTextareaField name="setup.headline" />
                </h2>
                <hr />
                <ArrowList>
                  <InlineBlocks
                    name="setup.steps"
                    blocks={SETUP_POINT_BLOCKS}
                  />
                </ArrowList>
                <DynamicLink
                  href={'/docs/getting-started/introduction/'}
                  passHref
                >
                  <Button as="a" color="primary">
                    Get Started
                  </Button>
                </DynamicLink>
              </RichTextWrapper>
              <CodeWrapper>
                <CodeExample
                  dangerouslySetInnerHTML={{
                    __html: `yarn add <b>gatsby-plugin-tinacms</b>

module.exports = {
  <span>// ...</span>
  plugins: [
    '<b>gatsby-plugin-tinacms</b>',
    <span>// ...</span>
  ],
};

export <b>WithTina</b>( <b>Component</b> );
                  `,
                  }}
                ></CodeExample>
              </CodeWrapper>
            </SetupLayout>
          </Wrapper>
        </Section>
      </Layout>
    </InlineForm>
  )
}

export default HomePage

export async function unstable_getStaticProps({ preview, previewData, query }) {
  const sourceProviderConnection = getGithubDataFromPreviewProps(previewData)
  let previewError: string
  let homeData = {}
  try {
    homeData = await getJsonData(
      'content/pages/home.json',
      sourceProviderConnection
    )
  } catch (e) {
    if (e instanceof ContentNotFoundError) {
      previewError = e.message
    } else {
      throw e
    }
  }

  return {
    props: {
      home: homeData,
      previewError,
      sourceProviderConnection,
      editMode: !!preview,
    },
  }
}

/*
 ** BLOCKS CONFIG ------------------------------------------------------
 */
/*
 ** TODO: these selling point blocks should be an inline group-list
 */

function SellingPoint({ data, index }) {
  return (
    <BlocksControls index={index}>
      <div key={safeSlice(data.main, 0, 8)}>
        <h3>
          <em>
            <BlockTextArea name="main" />
          </em>
        </h3>
        <p>
          <BlockTextArea name="supporting" />
        </p>
      </div>
    </BlocksControls>
  )
}

const selling_point_template: BlockTemplate = {
  type: 'selling_point',
  label: 'Selling Point',
  defaultItem: {
    main: 'Tina is dope 🤙',
    supporting:
      'It’s pretty much my favorite animal. It’s like a lion and a tiger mixed… bred for its skills in magic.',
  },
  // TODO: figure out what to do with keys
  key: undefined,
  fields: [],
}

const SELLING_POINTS_BLOCKS = {
  selling_point: {
    Component: SellingPoint,
    template: selling_point_template,
  },
}

function SetupPoint({ data, index }) {
  return (
    <BlocksControls index={index}>
      <li key={safeSlice(data.step, 0, 8)}>
        <BlockTextArea name="step" />
      </li>
    </BlocksControls>
  )
}

const setup_point_template: BlockTemplate = {
  type: 'setup_point',
  label: 'Setup Point',
  defaultItem: {
    step: 'Make yourself a dang quesadilla',
  },
  key: undefined,
  fields: [],
}

const SETUP_POINT_BLOCKS = {
  setup_point: {
    Component: SetupPoint,
    template: setup_point_template,
  },
}
/*
 ** STYLES -------------------------------------------------------
 */

const CodeWrapper = styled.div`
  border-radius: 50px;
  background-color: #d4f0ee;
  display: block;
  overflow: auto;
`

const CodeExample = styled.code`
  display: block;
  padding: 3rem;
  color: #241748;
  font-size: 1.125rem;
  line-height: 1.2;
  font-family: Monaco, 'Courier New', Courier, monospace;
  white-space: pre;
  filter: drop-shadow(rgba(104, 120, 125, 0.2) 0px 7px 8px);
  align-self: flex-start;
  width: 100%;
  display: block;

  b {
    color: var(--color-primary);
  }

  span {
    opacity: 0.3;
  }

  @media (min-width: 1200px) {
    font-size: 1.3725rem;
  }
`

const InfoLayout = styled.div`
  display: grid;
  grid-gap: 2rem;

  @media (min-width: 800px) {
    grid-template-columns: repeat(3, 1fr);
  }
`

const SetupLayout = styled.div`
  display: grid;
  grid-gap: 2rem;
  @media (min-width: 800px) {
    align-items: start;
    grid-gap: 4rem;
    grid-template-columns: repeat(2, 1fr);
  }
`

const CtaLayout = styled.div`
  max-width: 35rem;
  text-align: center;
  margin: 0 auto;
  padding: 0 0 3rem 0;

  @media (min-width: 800px) {
    padding: 0 0 5rem 0;
  }
`

const CtaBar = styled.div`
  margin: 2rem auto 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;
  iframe {
    margin-left: 1rem;
  }
  @media (min-width: 1030px) {
    iframe {
      display: none;
    }
  }
`

const safeSlice = (text: string | undefined, start: number, end: number) => {
  return (text || '').slice(start, end)
}
