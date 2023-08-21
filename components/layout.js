import Footer from "../components/footer";

export default function Layout({ preview, children }) {
  return (
    <>
      <div className="min-h-screen bg-white">
        <main className='bg-white'>{children}</main>
      </div>
      <Footer />
    </>
  );
}
