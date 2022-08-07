import React, { useState } from 'react'
import { graphql, navigate } from 'gatsby'
import { renderAst } from '../markdown'
import { ChapterContext } from '../context'
import Layout from '../components/layout'
import { Button } from '../components/button'
import * as classes from '../styles/chapter.module.sass'

const react_1 = require("react");
const isClient = typeof window !== 'undefined';
const useLocalStorage = (key, initialValue) => {
    if (!isClient) {
        // We're SSRing; can't use local storage here!
        return [initialValue, () => { }];
    }
    const [state, updateState] = react_1.useState(() => {
        try {
            const localStorageValue = window.localStorage.getItem(key);
            if (localStorageValue === null) {
                // Initialize local storage with default state
                window.localStorage.setItem(key, JSON.stringify(initialValue));
                return initialValue;
            }
            else {
                return JSON.parse(localStorageValue);
            }
        }
        catch (_a) {
            // User might be facing storage restrictions, or JSON
            // serialization/deserialization may have failed. We can just fall back
            // to using React state here.
            return initialValue;
        }
    });
    const localStorageChanged = (e) => {
        if (e.key === key) {
            updateState(JSON.parse(e.newValue));
        }
    };
    const setState = react_1.useCallback((value) => {
        window.localStorage.setItem(key, JSON.stringify(value));
        updateState(value);
    }, [key, updateState]);
    react_1.useEffect(() => {
        window.addEventListener('storage', localStorageChanged);
        return () => {
            window.removeEventListener('storage', localStorageChanged);
        };
    });
    return [state, setState];
};

const Template = ({ data }) => {
    const { markdownRemark, site } = data
    const { courseId } = site.siteMetadata
    const { frontmatter, htmlAst } = markdownRemark
    const { title, description, prev, next, id } = frontmatter
    const [activeExc, setActiveExc] = useState(null)
    const [completed, setCompleted] = useLocalStorage(`${courseId}-completed-${id}`, [])
    const html = renderAst(htmlAst)
    const buttons = [
        { slug: prev, text: '« Previous Chapter' },
        { slug: next, text: 'Next Chapter »' },
    ]

    return (
        <ChapterContext.Provider value={{ activeExc, setActiveExc, completed, setCompleted }}>
            <Layout title={title} description={description}>
                {html}

                <section className={classes.pagination}>
                    {buttons.map(({ slug, text }) => (
                        <div key={slug}>
                            {slug && (
                                <Button variant="secondary" small onClick={() => navigate(slug)}>
                                    {text}
                                </Button>
                            )}
                        </div>
                    ))}
                </section>
            </Layout>
        </ChapterContext.Provider>
    )
}

export default Template

export const pageQuery = graphql`
    query($slug: String!) {
        site {
            siteMetadata {
                courseId
            }
        }
        markdownRemark(fields: { slug: { eq: $slug } }) {
            htmlAst
            frontmatter {
                id
                title
                description
                next
                prev
            }
        }
    }
`
