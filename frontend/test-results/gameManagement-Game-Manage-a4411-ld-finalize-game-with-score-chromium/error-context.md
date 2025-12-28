# Page snapshot

```yaml
- generic [ref=e2]:
  - generic [ref=e4]:
    - generic [ref=e5]:
      - img [ref=e7]
      - heading "Welcome to SquadUp" [level=1] [ref=e9]
      - paragraph [ref=e10]: Sign in to your account
    - generic [ref=e11]:
      - generic [ref=e13]:
        - img [ref=e15]
        - text: Sign In
      - generic [ref=e18]:
        - generic [ref=e19]:
          - generic [ref=e20]:
            - generic [ref=e21]:
              - img [ref=e22]
              - text: Email Address *
            - textbox "Email Address *" [ref=e25]:
              - /placeholder: Enter your email
          - generic [ref=e26]:
            - generic [ref=e27]:
              - img [ref=e28]
              - text: Password *
            - generic [ref=e31]:
              - textbox "Password *" [ref=e32]:
                - /placeholder: Enter your password
              - button [ref=e33] [cursor=pointer]:
                - img [ref=e34]
          - button "Sign In" [disabled]
        - paragraph [ref=e38]: Don't have access? Contact your administrator to create an account.
  - generic [ref=e41]:
    - img [ref=e43]
    - button "Open Tanstack query devtools" [ref=e91] [cursor=pointer]:
      - img [ref=e92]
```