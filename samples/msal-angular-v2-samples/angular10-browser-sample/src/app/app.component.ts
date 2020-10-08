import { Component, OnInit, Inject, OnDestroy } from '@angular/core';
import { MsalService, MsalBroadcastService } from './msal';
import { MSAL_GUARD_CONFIG, InteractionType } from './msal/constants';
import { MsalGuardConfiguration } from './msal/msal.guard.config';
import { Subject } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';
import { BroadcastEvent, BroadcastMessage } from '@azure/msal-browser';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'Angular 10 - MSAL Browser Sample';
  isIframe = false;
  loggedIn = false;
  private readonly _destroying$ = new Subject<void>();

  constructor(
    @Inject(MSAL_GUARD_CONFIG) private msalGuardConfig: MsalGuardConfiguration,
    private authService: MsalService,
    private msalBroadcastService: MsalBroadcastService
  ) {}

  ngOnInit(): void {
    this.isIframe = window !== window.parent && !window.opener;

    this.checkAccount();

    this.msalBroadcastService.msalSubject$
      .pipe(
        filter((msg: BroadcastMessage) => msg.type === BroadcastEvent.LOGIN_SUCCESS || msg.type === BroadcastEvent.ACQUIRE_TOKEN_SUCCESS),
        takeUntil(this._destroying$)
      )
      .subscribe((result) => {
        console.log("EVENT: ", result);
        this.checkAccount();
      });
  }

  checkAccount() {
    this.loggedIn = this.authService.getAllAccounts().length > 0;
  }

  login() {
    if (this.msalGuardConfig.interactionType === InteractionType.POPUP) {
      this.authService.loginPopup({...this.msalGuardConfig.authRequest})
        .subscribe(() => this.checkAccount());
    } else {
      this.authService.loginRedirect({...this.msalGuardConfig.authRequest});
    }
  }

  logout() {
    this.authService.logout();
  }

  ngOnDestroy(): void {
    this._destroying$.next(null);
    this._destroying$.complete();
  }
}
