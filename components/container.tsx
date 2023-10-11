type ContainerProps = {
  children: React.ReactNode,
}

export default function Container({ children }: ContainerProps) {
  return <div className="container mx-auto px-5 bg-white">{children}</div>
}
