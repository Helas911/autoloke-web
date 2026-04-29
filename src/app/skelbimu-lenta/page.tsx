export default function Page() {
      return (
          <main style={{
                padding: "20px",
                      color: "white",
                            background: "#0b0b0b",
                                  minHeight: "100vh"
                                      }}>
                                            <h1 style={{fontSize:"32px", fontWeight:"700"}}>
                                                    Skelbimų lenta
                                                          </h1>

                                                                <p style={{opacity:0.8, marginTop:"10px"}}>
                                                                        Greitai rask ieškomas detales pagal markę ir modelį.
                                                                              </p>

                                                                                    <div style={{
                                                                                            marginTop:"30px",
                                                                                                    padding:"20px",
                                                                                                            border:"1px solid #333",
                                                                                                                    borderRadius:"14px",
                                                                                                                            background:"#111"
                                                                                                                                  }}>
                                                                                                                                          <h2>Ieškau BMW E60 ratlankių</h2>
                                                                                                                                                  <p>Kaunas</p>
                                                                                                                                                          <p>+37060000000</p>
                                                                                                                                                                </div>

                                                                                                                                                                      <div style={{
                                                                                                                                                                              marginTop:"15px",
                                                                                                                                                                                      padding:"20px",
                                                                                                                                                                                              border:"1px solid #333",
                                                                                                                                                                                                      borderRadius:"14px",
                                                                                                                                                                                                              background:"#111"
                                                                                                                                                                                                                    }}>
                                                                                                                                                                                                                            <h2>Ieškau Audi A6 C6 sparno</h2>
                                                                                                                                                                                                                                    <p>Vilnius</p>
                                                                                                                                                                                                                                            <p>+37060000000</p>
                                                                                                                                                                                                                                                  </div>
                                                                                                                                                                                                                                                      </main>
                                                                                                                                                                                                                                                        )
                                                                                                                                                                                                                                                        }
}