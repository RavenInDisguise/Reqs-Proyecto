--------------------------------------------------------------------------
-- Autor:       Paúl Rodríguez García
-- Fecha:       2023-05-18
-- Descripción: Procedimiento para actualizar los datos de un cubículo
--------------------------------------------------------------------------

CREATE OR ALTER PROCEDURE [dbo].[BiblioTEC_SP_ActualizarCubiculo]
    @IN_idCubiculo          INT,
    @IN_nombreNuevo         VARCHAR(16),
    @IN_capacidad           INT,
    @IN_estadoNuevo         VARCHAR(32),
    @IN_cancelarReservas    BIT,
    @IN_minutosMaximo       INT,
    @IN_servicios           TVP_Servicios READONLY
AS
BEGIN
    SET NOCOUNT ON;         -- No retorna metadatos

    -- CONTROL DE ERRORES
    DECLARE @ErrorNumber INT, @ErrorSeverity INT, @ErrorState INT, @Message VARCHAR(200);
    DECLARE @transaccion_iniciada BIT = 0;

    -- DECLARACIÓN DE VARIABLES
    DECLARE @DESCRIPCION_ELIMINADO VARCHAR(32) = 'Eliminado';
    DECLARE @ID_ELIMINADO INT = NULL;

    DECLARE @idEstadoNuevo INT;
    DECLARE @nombreCambia BIT = 0;
    DECLARE @capacidadCambia BIT = 0;
    DECLARE @estadoCambia BIT = 0;
    DECLARE @tiempoCambia BIT = 0;

    DECLARE @salida TABLE (
        correo  VARCHAR(128)
    );
    DECLARE @servicioInvalido VARCHAR(32) = '';

    BEGIN TRY

        -- VALIDACIONES

        -- Busca el ID del estado que corresponde a los eliminados
        SELECT  @ID_ELIMINADO = COALESCE(EC.[id], NULL)
        FROM    [dbo].[EstadosCubiculo] EC
        WHERE   EC.[descripcion] = @DESCRIPCION_ELIMINADO;

        -- Verifica si existe
        IF NOT EXISTS ( SELECT  1
                        FROM    [dbo].[Cubiculos] C
                        INNER JOIN  [dbo].[EstadosCubiculo] EC
                            ON  C.[idEstado] = EC.[id]
                        WHERE   C.[id] = @IN_idCubiculo
                            AND EC.[id] != @ID_ELIMINADO )
        BEGIN
            RAISERROR('No existe ningún cubículo con el ID %d', 16, 1, @IN_idCubiculo);
        END;

        -- ¿Cambió el nombre?
        IF @IN_nombreNuevo != ( SELECT  C.[nombre]
                                FROM    [dbo].[Cubiculos] C
                                WHERE   C.[id] = @IN_idCubiculo)
        BEGIN
            -- El nombre cambió
            IF EXISTS(  SELECT  C.[nombre]
                        FROM    [dbo].[Cubiculos] C
                        INNER JOIN [dbo].[EstadosCubiculo] EC
                            ON  C.[idEstado] = EC.[id]
                        WHERE   C.[nombre] = @IN_nombreNuevo
                            AND EC.[id] != @ID_ELIMINADO  )
            BEGIN
                -- Ya hay un cubículo con el mismo nombre
                RAISERROR('Ya existe otro cubículo con el nombre "%s"', 16, 1, @IN_nombreNuevo);
            END
            ELSE
            BEGIN
                -- No hay un cubículo con el mismo nombre
                SET @nombreCambia = 1;
            END;
        END;

        -- ¿Cambió la capacidad?
        IF @IN_capacidad != (   SELECT  C.[capacidad]
                                FROM    [dbo].[Cubiculos] C
                                WHERE   C.[id] = @IN_idCubiculo)
        BEGIN
            -- La capacidad cambió
            IF @IN_capacidad > 0
            BEGIN
                SET @capacidadCambia = 1;
            END
            ELSE
            BEGIN
                RAISERROR('La capacidad "%d" no es válida', 16, 1, @IN_capacidad);
            END;
        END;

        -- ¿Cambió el tiempo máximo?
        IF @IN_minutosMaximo != (SELECT  C.[minutosMax]
                                FROM    [dbo].[Cubiculos] C
                                WHERE   C.[id] = @IN_idCubiculo)
        BEGIN
            -- La capacidad cambió
            SET @tiempoCambia = 1;
        END;

        -- ¿Cambió el estado?
        IF @IN_estadoNuevo != ( SELECT  EC.[descripcion]
                                FROM    [dbo].[Cubiculos] C
                                INNER JOIN  [dbo].[EstadosCubiculo] EC
                                    ON  C.[idEstado] = EC.[id]
                                WHERE   C.[id] = @IN_idCubiculo )
        BEGIN
            -- El estado cambió
        
            IF EXISTS(  SELECT  EC.[id]
                        FROM    [dbo].[EstadosCubiculo] EC
                        WHERE   EC.[descripcion] = @IN_estadoNuevo
                            AND EC.[id] != @ID_ELIMINADO )
            BEGIN
                SET @estadoCambia = 1;
                SET @idEstadoNuevo = (
                        SELECT  EC.[id]
                        FROM    [dbo].[EstadosCubiculo] EC
                        WHERE   EC.[descripcion] = @IN_estadoNuevo );
            END
            ELSE
            BEGIN
                RAISERROR('El estado "%s" no existe', 16, 1, @IN_estadoNuevo);
            END;
        END;

        -- ¿Los servicios son válidos?
        IF EXISTS (
            SELECT TOP 1
                    i_S.[descripcion]
            FROM    @IN_servicios i_S
            LEFT JOIN [dbo].[ServiciosEspeciales] S
                ON  S.[descripcion] = i_S.[descripcion]
            WHERE   S.[descripcion] IS NULL
        )
        BEGIN
            -- Si entra acá, algún servicio no existe
            SET @servicioInvalido = (
                SELECT TOP 1
                        i_S.[descripcion]
                FROM    @IN_servicios i_S
                LEFT JOIN [dbo].[ServiciosEspeciales] S
                    ON  S.[descripcion] = i_S.[descripcion]
                WHERE   S.[descripcion] IS NULL
            );
            RAISERROR('El servicio "%s" no existe', 16, 1, @servicioInvalido);
        END;

        -- Se guardan los correos de quienes tienen reservas
        INSERT INTO @salida ([correo])
        SELECT    U.[correo]
        FROM      [dbo].[Usuarios] U
        INNER JOIN    [dbo].[Estudiantes] E
            ON  E.[idUsuario] = U.[id]
        INNER JOIN    [dbo].[Reservas] R
            ON  R.[idEstudiante] = E.[id]
        WHERE R.[idCubiculo] = @IN_idCubiculo
            AND R.[activo] = 1
            AND R.[horaInicio] > GETUTCDATE();

        -- INICIO DE LA TRANSACCIÓN
        IF @@TRANCOUNT = 0
        BEGIN
            SET @transaccion_iniciada = 1;
            BEGIN TRANSACTION;
        END;

            -- ----- CAMBIO DE NOMBRE -----
            IF @nombreCambia = 1
            BEGIN
                UPDATE  C
                SET     C.[nombre] = @IN_nombreNuevo
                FROM    [dbo].[Cubiculos] C
                WHERE   C.[id] = @IN_idCubiculo;
            END;

            -- ----- CAMBIO DE CAPACIDAD -----
            IF @capacidadCambia = 1
            BEGIN
                UPDATE  C
                SET     C.[capacidad] = @IN_capacidad
                FROM    [dbo].[Cubiculos] C
                WHERE   C.[id] = @IN_idCubiculo;
            END;

            -- ----- CAMBIO DE TIEMPO -----
            IF @tiempoCambia = 1
            BEGIN
                UPDATE  C
                SET     C.[minutosMax] = @IN_minutosMaximo
                FROM    [dbo].[Cubiculos] C
                WHERE   C.[id] = @IN_idCubiculo;
            END;

            -- ----- CAMBIO DE ESTADO -----
            IF @estadoCambia = 1
            BEGIN
                UPDATE  C
                SET     C.[idEstado] = @idEstadoNuevo
                FROM    [dbo].[Cubiculos] C
                WHERE   C.[id] = @IN_idCubiculo;
            END;

            -- ----- CAMBIO DE SERVICIOS -----

            -- Se desactivan los servicios que se cambiaron de 1 a 0

            UPDATE  SdC
            SET     SdC.[activo] = 0
            FROM    [dbo].[ServiciosDeCubiculo] SdC
            INNER JOIN  [dbo].[ServiciosEspeciales] SE
                ON  SE.[id] = SdC.[idServiciosEspeciales]
            INNER JOIN  @IN_servicios tS
                ON  tS.[descripcion] = SE.[descripcion]
            WHERE   tS.[activo] = 0
                AND SdC.[activo] = 1
                AND SdC.[idCubiculo] = @IN_idCubiculo;

            -- Se reactivan los servicios que cambiaron de 0 a 1

            UPDATE  SdC
            SET     SdC.[activo] = 1
            FROM    [dbo].[ServiciosDeCubiculo] SdC
            INNER JOIN  [dbo].[ServiciosEspeciales] SE
                ON  SE.[id] = SdC.[idServiciosEspeciales]
            INNER JOIN  @IN_servicios tS
                ON  tS.[descripcion] = SE.[descripcion]
            WHERE   tS.[activo] = 1
                AND SdC.[activo] = 0
                AND SdC.[idCubiculo] = @IN_idCubiculo;

            -- Se agregan los servicios que no se hayan agregado antes

            INSERT INTO [dbo].[ServiciosDeCubiculo]
            (
                [idCubiculo],
                [idServiciosEspeciales],
                [activo]
            )
            SELECT  @IN_idCubiculo,
                    SE.[id],
                    1
            FROM    [dbo].[ServiciosEspeciales] SE
            INNER JOIN  @IN_servicios tS
                ON  tS.[descripcion] = SE.[descripcion]
                AND tS.[activo] = 1
            WHERE NOT EXISTS(
                SELECT  1
                FROM    [dbo].[ServiciosDeCubiculo] SdC
                WHERE   SdC.[idServiciosEspeciales] = SE.[id]
                    AND SdC.[idCubiculo] = @IN_idCubiculo
            );

            -- Se desactivan las reservas en caso de haberse seleccionado la opción

            IF @IN_cancelarReservas = 1
            BEGIN
                UPDATE  R
                SET     R.[activo] = 0,
                        R.[confirmado] = 0
                FROM    [dbo].[Reservas] R
                WHERE R.[idCubiculo] = @IN_idCubiculo
                AND R.[horaInicio] > GETUTCDATE();
            END;

        -- COMMIT DE LA TRANSACCIÓN
        IF @transaccion_iniciada = 1
        BEGIN
            COMMIT TRANSACTION;
        END;

        -- Devuelve los correos
        SELECT  S.[correo]
        FROM    @salida S;

    END TRY
    BEGIN CATCH

        SET @ErrorNumber = ERROR_NUMBER();
        SET @ErrorSeverity = ERROR_SEVERITY();
        SET @ErrorState = ERROR_STATE();
        SET @Message = ERROR_MESSAGE();

        IF @transaccion_iniciada = 1
        BEGIN
            ROLLBACK;
        END;

        IF @ErrorNumber != 50000
        BEGIN
            -- Si no es un error personalizado, se registra el error
            INSERT INTO [dbo].[Errors]
            VALUES (
                SUSER_NAME(),
                ERROR_NUMBER(),
                ERROR_STATE(),
                ERROR_SEVERITY(),
                ERROR_LINE(),
                ERROR_PROCEDURE(),
                ERROR_MESSAGE(),
                GETUTCDATE()
            );
        END;

        RAISERROR('%s - Error Number: %i', 
            @ErrorSeverity, @ErrorState, @Message, @ErrorNumber);

    END CATCH;
END;