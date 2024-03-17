import { RefObject, useEffect, useRef, useState } from "react";
import fetchJSON from "./fetch";
import { useQuery } from "@tanstack/react-query";

async function getWikiPage(pageName = "") {
  const payload = await fetchJSON(
    `https://en.wikipedia.org/w/api.php?action=parse&prop=text&page=${encodeURIComponent(
      pageName
    )}&format=json&disableeditsection=1&redirects=true&useskin=minerva&origin=*`
  );

  return {
    title: payload.parse.title as string,
    pageId: payload.parse.pageid as number,
    body: payload.parse.text["*"] as string,
  };
}

function traverseWiki(contentRef: RefObject<HTMLElement>) {
  const root = contentRef.current;
  if (!root) {
    return [];
  }

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT);

  const anchorElements: HTMLAnchorElement[] = [];
  while (walker.nextNode()) {
    const node = walker.currentNode;
    if (node.nodeName !== "A") continue;
    anchorElements.push(node as HTMLAnchorElement);
  }

  return anchorElements;
}

function App() {
  const [pageName, setPageName] = useState("Hitachi");
  const {
    data: page,
    isLoading,
    isSuccess,
  } = useQuery({
    queryKey: ["wiki-page", pageName],
    queryFn: () => getWikiPage(pageName),
    staleTime: Infinity,
  });

  const contentRef = useRef<HTMLElement>(null);
  useEffect(() => {
    if (!pageName && !isSuccess) return;

    const anchorElements = traverseWiki(contentRef);

    anchorElements
      .filter(
        (node) =>
          node.classList.contains("external") ||
          node.classList.contains("extiw") ||
          node.classList.contains("new") ||
          node.title.includes("Edit this at Wikidata")
      )
      .forEach((node) => node.replaceWith(...node.childNodes));

    const validAnchors = anchorElements
      .filter((node) => !node.classList.contains("external"))
      .filter((node) => {
        if (!node.href) return false;
        return node.href.includes("/wiki/");
      });

    const cb = function (this: HTMLAnchorElement, event: MouseEvent) {
      event.preventDefault();
      setPageName(this.title);
    };

    validAnchors.forEach((node) => {
      const title = node.title;
      node.href = `https://en.wikipedia.org/wiki/${encodeURIComponent(title)}`;
      node.addEventListener("click", cb);
    });

    return () => {
      validAnchors.forEach((node) => node.removeEventListener("click", cb));
    };
  }, [pageName, isSuccess]);

  if (isLoading) {
    return "loading...";
  }

  if (!page) {
    return "no data";
  }

  return (
    <section className="wiki-wrapper lang-en">
      <header className="pre-content heading-holder">
        <div className="page-heading">
          <h1 id="section_0">{page.title}</h1>
        </div>
      </header>
      <main
        ref={contentRef}
        dangerouslySetInnerHTML={{ __html: page.body }}
        className="content"
      ></main>
    </section>
  );
}

export default App;
