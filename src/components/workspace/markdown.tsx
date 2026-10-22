import ReactMarkdown from 'react-markdown'
export function Markdown({ children }: { children: string }) {
  return (
    <div className="markdown text-sm">
      <ReactMarkdown
        skipHtml
        disallowedElements={['img']}
        components={{
          a: (props) => (
            <a {...props} rel="noreferrer noopener" target="_blank" />
          ),
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  )
}
